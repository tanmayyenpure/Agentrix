package com.flowforge.service.execution;

import com.flowforge.model.WorkflowNode;
import com.flowforge.model.enums.NodeType;
import org.springframework.stereotype.Component;

/**
 * Lightweight templating: replaces {{nodeClientId}} placeholders in the node's config
 * ("template" field) with the string output of that upstream node.
 * Config example: {"template": "Order {{trigger}} was processed"}
 */
@Component
public class TransformNodeExecutor implements NodeExecutor {

    @Override
    public NodeType supportedType() {
        return NodeType.TRANSFORM;
    }

    @Override
    public NodeExecutionResult execute(WorkflowNode node, ExecutionContext context) {
        String template = node.getConfig() != null ? node.getConfig() : "";
        String result = template;
        for (var entry : context.getVariables().entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            if (result.contains(placeholder)) {
                String value = entry.getValue() != null ? entry.getValue().toString() : "";
                result = result.replace(placeholder, value);
            }
        }
        return NodeExecutionResult.builder().success(true).output(result).build();
    }
}
