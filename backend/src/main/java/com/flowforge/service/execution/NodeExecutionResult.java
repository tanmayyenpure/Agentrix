package com.flowforge.service.execution;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NodeExecutionResult {
    private boolean success;
    private String output;
    private String errorMessage;
    /** For CONDITION nodes: which outgoing branch to follow next ("true"/"false"). Null = follow all. */
    private String branchTaken;
}
