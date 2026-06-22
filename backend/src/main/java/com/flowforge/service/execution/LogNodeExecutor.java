package com.flowforge.service.execution;

import com.flowforge.model.WorkflowNode;
import com.flowforge.model.enums.NodeType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/** Writes the current context (or a configured message) to the application log. */
@Slf4j
@Component
public class LogNodeExecutor implements NodeExecutor {

    @Override
    public NodeType supportedType() {
        return NodeType.LOG;
    }

    @Override
    public NodeExecutionResult execute(WorkflowNode node, ExecutionContext context) {
        String message = node.getConfig() != null ? node.getConfig() : context.getInputPayload();
        log.info("[Workflow node '{}'] {}", node.getLabel(), message);
        return NodeExecutionResult.builder()
                .success(true)
                .output(message)
                .build();
    }
}
