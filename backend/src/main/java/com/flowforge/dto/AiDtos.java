package com.flowforge.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

import java.time.Instant;
import java.util.List;

public class AiDtos {
    public record GenerateWorkflowRequest(@NotBlank String prompt, String name, boolean createWorkflow) {}
    public record GeneratedWorkflowResponse(String name, String description, List<NodeDto> nodes, List<EdgeDto> edges, Long workflowId, String summary) {}

    public record CreateAgentRequest(@NotBlank String name, @NotBlank String instructions, String model, boolean enabled) {}
    public record RunAgentRequest(@NotBlank String input) {}
    @Builder
    public record AiAgentResponse(Long id, String name, String instructions, String model, boolean enabled, Instant createdAt, Instant updatedAt) {}
    public record AgentRunResponse(Long agentId, String output, Instant ranAt) {}

    public record ConnectorResponse(Long id, String slug, String name, String category, String description, String authType, boolean installedByDefault) {}
    public record InstallConnectorRequest(String workflowName) {}
}
