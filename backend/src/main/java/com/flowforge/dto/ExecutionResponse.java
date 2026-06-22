package com.flowforge.dto;

import com.flowforge.model.enums.ExecutionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionResponse {
    private Long id;
    private Long workflowId;
    private ExecutionStatus status;
    private String inputPayload;
    private String errorMessage;
    private List<ExecutionLogDto> logs;
    private Instant startedAt;
    private Instant finishedAt;
}
