package com.flowforge.service.execution;

import com.flowforge.model.WorkflowNode;
import com.flowforge.model.enums.NodeType;

public interface NodeExecutor {
    NodeType supportedType();
    NodeExecutionResult execute(WorkflowNode node, ExecutionContext context);
}
