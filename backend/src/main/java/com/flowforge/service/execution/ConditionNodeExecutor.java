package com.flowforge.service.execution;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.flowforge.model.WorkflowNode;
import com.flowforge.model.enums.NodeType;
import org.springframework.stereotype.Component;

/**
 * Evaluates a simple equality/contains condition against a referenced upstream node's output, then
 * tells the engine which outgoing edge branch ("true" / "false") to follow.
 * Config example: {"sourceNode": "node-2", "operator": "equals", "value": "ok"}
 * Supported operators: equals, notEquals, contains.
 */
@Component
public class ConditionNodeExecutor implements NodeExecutor {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public NodeType supportedType() {
        return NodeType.CONDITION;
    }

    @Override
    public NodeExecutionResult execute(WorkflowNode node, ExecutionContext context) {
        if (node.getConfig() == null) {
            return NodeExecutionResult.builder().success(false).errorMessage("Missing CONDITION config").build();
        }
        try {
            JsonNode cfg = objectMapper.readTree(node.getConfig());
            String sourceNode = cfg.path("sourceNode").asText(null);
            String operator = cfg.path("operator").asText("equals");
            String expected = cfg.path("value").asText("");

            Object actualObj = sourceNode != null ? context.getNodeOutput(sourceNode) : context.getInputPayload();
            String actual = actualObj != null ? actualObj.toString() : "";

            boolean result = switch (operator) {
                case "notEquals" -> !actual.equals(expected);
                case "contains" -> actual.contains(expected);
                default -> actual.equals(expected);
            };

            return NodeExecutionResult.builder()
                    .success(true)
                    .output(String.valueOf(result))
                    .branchTaken(result ? "true" : "false")
                    .build();
        } catch (Exception e) {
            return NodeExecutionResult.builder().success(false).errorMessage("Invalid CONDITION config: " + e.getMessage()).build();
        }
    }
}
