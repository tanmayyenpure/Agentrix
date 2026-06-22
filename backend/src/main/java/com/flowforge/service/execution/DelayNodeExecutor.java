package com.flowforge.service.execution;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.flowforge.model.WorkflowNode;
import com.flowforge.model.enums.NodeType;
import org.springframework.stereotype.Component;

/** Pauses execution. Config: {"seconds": 5}. Capped to 30s to avoid blocking the engine thread for too long. */
@Component
public class DelayNodeExecutor implements NodeExecutor {

    private static final long MAX_DELAY_SECONDS = 30;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public NodeType supportedType() {
        return NodeType.DELAY;
    }

    @Override
    public NodeExecutionResult execute(WorkflowNode node, ExecutionContext context) {
        long seconds = 1;
        try {
            if (node.getConfig() != null) {
                JsonNode cfg = objectMapper.readTree(node.getConfig());
                if (cfg.has("seconds")) {
                    seconds = Math.min(cfg.get("seconds").asLong(1), MAX_DELAY_SECONDS);
                }
            }
            Thread.sleep(seconds * 1000L);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            return NodeExecutionResult.builder().success(false).errorMessage("Delay interrupted").build();
        } catch (Exception e) {
            return NodeExecutionResult.builder().success(false).errorMessage("Invalid delay config: " + e.getMessage()).build();
        }
        return NodeExecutionResult.builder().success(true).output("Delayed " + seconds + "s").build();
    }
}
