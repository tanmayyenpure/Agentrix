package com.flowforge.dto;

import lombok.Builder;

import java.time.Instant;

@Builder
public record WorkflowVersionResponse(
        Long id,
        Long workflowId,
        int version,
        String name,
        Long createdByUserId,
        String createdByEmail,
        Instant createdAt
) {}
