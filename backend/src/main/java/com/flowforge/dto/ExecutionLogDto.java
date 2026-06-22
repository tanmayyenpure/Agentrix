package com.flowforge.dto;

import com.flowforge.model.enums.ExecutionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionLogDto {
    private String nodeClientId;
    private String nodeLabel;
    private ExecutionStatus status;
    private String output;
    private String errorMessage;
    private Instant timestamp;
    private long durationMs;
}
