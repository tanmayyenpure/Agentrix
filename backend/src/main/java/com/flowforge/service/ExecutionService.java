package com.flowforge.service;

import com.flowforge.dto.ExecutionLogDto;
import com.flowforge.dto.ExecutionResponse;
import com.flowforge.exception.AccessDeniedAppException;
import com.flowforge.exception.ResourceNotFoundException;
import com.flowforge.model.Execution;
import com.flowforge.model.User;
import com.flowforge.model.Workflow;
import com.flowforge.repository.ExecutionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExecutionService {

    private final WorkflowService workflowService;
    private final ExecutionEngineService executionEngineService;
    private final ExecutionRepository executionRepository;

    public ExecutionResponse trigger(Long workflowId, String inputPayload, User requester) {
        Workflow workflow = workflowService.getOwnedWorkflow(workflowId, requester);
        Execution execution = executionEngineService.run(workflow, requester, inputPayload);
        return toResponse(execution);
    }

    public ExecutionResponse get(Long executionId, User requester) {
        Execution execution = executionRepository.findById(executionId)
                .orElseThrow(() -> new ResourceNotFoundException("Execution not found: " + executionId));
        if (execution.getWorkflow().getOrganization() == null || requester.getOrganization() == null
                || !execution.getWorkflow().getOrganization().getId().equals(requester.getOrganization().getId())) {
            throw new AccessDeniedAppException("You do not have access to this execution");
        }
        return toResponse(execution);
    }

    public List<ExecutionResponse> listForWorkflow(Long workflowId, User requester) {
        workflowService.getOwnedWorkflow(workflowId, requester); // ownership check
        return executionRepository.findByWorkflowIdOrderByStartedAtDesc(workflowId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public ExecutionResponse toResponse(Execution execution) {
        List<ExecutionLogDto> logs = execution.getLogs().stream()
                .map(l -> ExecutionLogDto.builder()
                        .nodeClientId(l.getNodeClientId())
                        .nodeLabel(l.getNodeLabel())
                        .status(l.getStatus())
                        .output(l.getOutput())
                        .errorMessage(l.getErrorMessage())
                        .timestamp(l.getTimestamp())
                        .durationMs(l.getDurationMs())
                        .build())
                .collect(Collectors.toList());

        return ExecutionResponse.builder()
                .id(execution.getId())
                .workflowId(execution.getWorkflow().getId())
                .status(execution.getStatus())
                .inputPayload(execution.getInputPayload())
                .errorMessage(execution.getErrorMessage())
                .logs(logs)
                .startedAt(execution.getStartedAt())
                .finishedAt(execution.getFinishedAt())
                .build();
    }
}
