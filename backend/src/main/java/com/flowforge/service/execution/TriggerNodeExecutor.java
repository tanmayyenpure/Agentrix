package com.flowforge.service.execution;

import com.flowforge.model.WorkflowNode;
import com.flowforge.model.enums.NodeType;
import org.springframework.stereotype.Component;

/** Handles TRIGGER_MANUAL, TRIGGER_WEBHOOK, TRIGGER_SCHEDULE: simply seeds the context with the input payload. */
@Component
public class TriggerNodeExecutor implements NodeExecutor {

    @Override
    public NodeType supportedType() {
        // Registered for all trigger types via ExecutionEngineService's multi-type map.
        return NodeType.TRIGGER_MANUAL;
    }

    @Override
    public NodeExecutionResult execute(WorkflowNode node, ExecutionContext context) {
        String output = context.getInputPayload() != null ? context.getInputPayload() : "{}";
        return NodeExecutionResult.builder()
                .success(true)
                .output(output)
                .build();
    }
}
