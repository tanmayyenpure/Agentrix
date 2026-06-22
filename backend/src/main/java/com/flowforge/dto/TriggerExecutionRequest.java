package com.flowforge.dto;

import lombok.Data;

@Data
public class TriggerExecutionRequest {
    /** Optional JSON string passed as input to the workflow's trigger node. */
    private String inputPayload;
}
