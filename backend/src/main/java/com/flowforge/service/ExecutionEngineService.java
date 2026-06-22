package com.flowforge.service;

import com.flowforge.model.*;
import com.flowforge.model.enums.ExecutionStatus;
import com.flowforge.model.enums.NodeType;
import com.flowforge.repository.ExecutionRepository;
import com.flowforge.service.execution.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Executes a Workflow's node graph.
 *
 * Algorithm:
 *  1. Find "root" nodes (nodes with no incoming edges) — these are the trigger nodes to start from.
 *  2. Walk the graph breadth-first from each root, executing each node exactly once.
 *  3. For CONDITION nodes, only the outgoing edge matching the branch result ("true"/"false") is followed;
 *     other outgoing edges are skipped for this run.
 *  4. Every node's result is persisted as an ExecutionLog. The overall Execution is marked SUCCESS
 *     only if every visited node succeeded.
 */
@Slf4j
@Service
public class ExecutionEngineService {

    private final ExecutionRepository executionRepository;
    private final Map<NodeType, NodeExecutor> executors = new HashMap<>();

    public ExecutionEngineService(
            ExecutionRepository executionRepository,
            TriggerNodeExecutor triggerNodeExecutor,
            LogNodeExecutor logNodeExecutor,
            DelayNodeExecutor delayNodeExecutor,
            HttpRequestNodeExecutor httpRequestNodeExecutor,
            ConditionNodeExecutor conditionNodeExecutor,
            TransformNodeExecutor transformNodeExecutor) {
        this.executionRepository = executionRepository;

        // Trigger executor handles all three trigger node types.
        executors.put(NodeType.TRIGGER_MANUAL, triggerNodeExecutor);
        executors.put(NodeType.TRIGGER_WEBHOOK, triggerNodeExecutor);
        executors.put(NodeType.TRIGGER_SCHEDULE, triggerNodeExecutor);

        executors.put(NodeType.LOG, logNodeExecutor);
        executors.put(NodeType.DELAY, delayNodeExecutor);
        executors.put(NodeType.HTTP_REQUEST, httpRequestNodeExecutor);
        executors.put(NodeType.CONDITION, conditionNodeExecutor);
        executors.put(NodeType.TRANSFORM, transformNodeExecutor);
    }

    @Transactional
    public Execution run(Workflow workflow, User triggeredBy, String inputPayload) {
        Execution execution = Execution.builder()
                .workflow(workflow)
                .triggeredBy(triggeredBy)
                .status(ExecutionStatus.RUNNING)
                .inputPayload(inputPayload)
                .build();
        execution = executionRepository.save(execution);

        if (workflow.getNodes().isEmpty()) {
            return finish(execution, ExecutionStatus.FAILED, "Workflow has no nodes");
        }

        Map<String, WorkflowNode> nodesByClientId = new HashMap<>();
        for (WorkflowNode n : workflow.getNodes()) {
            nodesByClientId.put(n.getClientId(), n);
        }

        // Build adjacency: sourceClientId -> list of edges
        Map<String, List<WorkflowEdge>> outgoing = new HashMap<>();
        Set<String> targets = new HashSet<>();
        for (WorkflowEdge e : workflow.getEdges()) {
            outgoing.computeIfAbsent(e.getSourceClientId(), k -> new ArrayList<>()).add(e);
            targets.add(e.getTargetClientId());
        }

        // Root nodes = nodes never referenced as a target.
        List<WorkflowNode> roots = new ArrayList<>();
        for (WorkflowNode n : workflow.getNodes()) {
            if (!targets.contains(n.getClientId())) {
                roots.add(n);
            }
        }
        if (roots.isEmpty()) {
            // Cyclic graph with no clear start — fall back to declaration order's first node.
            roots.add(workflow.getNodes().get(0));
        }

        ExecutionContext context = new ExecutionContext(inputPayload);
        Set<String> visited = new HashSet<>();
        Deque<String> queue = new ArrayDeque<>();
        for (WorkflowNode root : roots) {
            queue.add(root.getClientId());
        }

        boolean allSucceeded = true;
        String firstError = null;

        while (!queue.isEmpty()) {
            String clientId = queue.poll();
            if (visited.contains(clientId)) continue;
            visited.add(clientId);

            WorkflowNode node = nodesByClientId.get(clientId);
            if (node == null) continue; // dangling edge reference

            long start = System.currentTimeMillis();
            NodeExecutor executor = executors.get(node.getType());
            NodeExecutionResult result;
            if (executor == null) {
                result = NodeExecutionResult.builder()
                        .success(false)
                        .errorMessage("No executor registered for node type " + node.getType())
                        .build();
            } else {
                try {
                    result = executor.execute(node, context);
                } catch (Exception ex) {
                    result = NodeExecutionResult.builder()
                            .success(false)
                            .errorMessage("Unhandled exception: " + ex.getMessage())
                            .build();
                }
            }
            long durationMs = System.currentTimeMillis() - start;

            context.setNodeOutput(clientId, result.getOutput());

            execution.getLogs().add(ExecutionLog.builder()
                    .execution(execution)
                    .nodeClientId(clientId)
                    .nodeLabel(node.getLabel())
                    .status(result.isSuccess() ? ExecutionStatus.SUCCESS : ExecutionStatus.FAILED)
                    .output(result.getOutput())
                    .errorMessage(result.getErrorMessage())
                    .durationMs(durationMs)
                    .build());

            if (!result.isSuccess()) {
                allSucceeded = false;
                if (firstError == null) firstError = node.getLabel() + ": " + result.getErrorMessage();
                // Don't propagate past a failed node.
                continue;
            }

            List<WorkflowEdge> nextEdges = outgoing.getOrDefault(clientId, List.of());
            for (WorkflowEdge edge : nextEdges) {
                boolean shouldFollow = result.getBranchTaken() == null
                        || edge.getConditionBranch() == null
                        || edge.getConditionBranch().equalsIgnoreCase(result.getBranchTaken());
                if (shouldFollow && !visited.contains(edge.getTargetClientId())) {
                    queue.add(edge.getTargetClientId());
                }
            }
        }

        return finish(execution, allSucceeded ? ExecutionStatus.SUCCESS : ExecutionStatus.FAILED, firstError);
    }

    private Execution finish(Execution execution, ExecutionStatus status, String errorMessage) {
        execution.setStatus(status);
        execution.setErrorMessage(errorMessage);
        execution.setFinishedAt(Instant.now());
        return executionRepository.save(execution);
    }
}
