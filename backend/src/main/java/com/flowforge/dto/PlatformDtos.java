package com.flowforge.dto;

import com.flowforge.model.enums.ExecutionStatus;
import com.flowforge.model.enums.NotificationType;
import com.flowforge.model.enums.ResourceType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.time.Instant;
import java.util.List;

public class PlatformDtos {
    public record CreateWebhookRequest(@NotNull Long workflowId, @NotBlank String name) {}
    public record WebhookResponse(Long id, String name, Long workflowId, String workflowName, String secret, String url, Instant createdAt, long hitCount, Instant lastTriggeredAt) {}

    public record CreateScheduleRequest(@NotNull Long workflowId, @NotBlank String cronExpression, boolean enabled) {}
    public record ScheduleResponse(Long id, Long workflowId, String workflowName, String cronExpression, boolean enabled, Instant nextRunAt, Instant lastRunAt, ExecutionStatus lastStatus) {}

    public record NotificationResponse(Long id, String title, String message, NotificationType type, Long workflowId, Long executionId, boolean read, Instant createdAt) {}

    @Builder
    public record AuditResponse(Long id, String action, ResourceType resourceType, Long resourceId, String resourceName, Long userId, String userEmail, String metadata, Instant createdAt) {}
    public record AuditPageResponse(List<AuditResponse> content, long totalElements, int totalPages) {}

    public record CreateApiKeyRequest(@NotBlank String name, String expiresAt) {}
    public record ApiKeyResponse(Long id, String name, String keyPrefix, Instant createdAt, Instant lastUsedAt, Instant expiresAt, boolean active) {}
    public record CreatedApiKeyResponse(Long id, String name, String keyPrefix, Instant createdAt, Instant lastUsedAt, Instant expiresAt, boolean active, String fullKey) {}

    public record OrgResponse(Long id, String name, int memberCount, Instant createdAt) {}
    public record TeamMemberResponse(Long id, String fullName, String email, String role, Instant joinedAt, Instant lastActiveAt) {}
    public record InviteMemberRequest(@Email @NotBlank String email, @NotBlank String role) {}
    public record UpdateMemberRoleRequest(@NotBlank String role) {}
}
