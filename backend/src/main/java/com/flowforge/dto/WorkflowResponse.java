package com.flowforge.dto;

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
public class WorkflowResponse {
    private Long id;
    private String name;
    private String description;
    private boolean active;
    private int version;
    private Long ownerId;
    private List<NodeDto> nodes;
    private List<EdgeDto> edges;
    private Instant createdAt;
    private Instant updatedAt;
}
