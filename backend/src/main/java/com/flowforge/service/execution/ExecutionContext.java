package com.flowforge.service.execution;

import java.util.HashMap;
import java.util.Map;

/**
 * Carries state between nodes during a single workflow run.
 * Each node's output is stored keyed by its clientId so downstream nodes
 * (and templates in their config) can reference it.
 */
public class ExecutionContext {

    private final Map<String, Object> variables = new HashMap<>();
    private final String inputPayload;

    public ExecutionContext(String inputPayload) {
        this.inputPayload = inputPayload;
        this.variables.put("input", inputPayload);
    }

    public void setNodeOutput(String nodeClientId, Object output) {
        variables.put(nodeClientId, output);
    }

    public Object getNodeOutput(String nodeClientId) {
        return variables.get(nodeClientId);
    }

    public String getInputPayload() {
        return inputPayload;
    }

    public Map<String, Object> getVariables() {
        return variables;
    }
}
