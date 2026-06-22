package com.flowforge.service;

import com.flowforge.dto.ExecutionResponse;
import com.flowforge.dto.PlatformDtos.*;
import com.flowforge.exception.AccessDeniedAppException;
import com.flowforge.exception.BadRequestException;
import com.flowforge.exception.ResourceNotFoundException;
import com.flowforge.model.*;
import com.flowforge.model.enums.NotificationType;
import com.flowforge.model.enums.ResourceType;
import com.flowforge.model.enums.RoleName;
import com.flowforge.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PlatformService {
    private final WorkflowRepository workflowRepository;
    private final WebhookRepository webhookRepository;
    private final ScheduleEntryRepository scheduleRepository;
    private final AppNotificationRepository notificationRepository;
    private final AuditLogRepository auditRepository;
    private final ApiKeyRepository apiKeyRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ExecutionEngineService executionEngineService;
    private final ExecutionService executionService;
    private final PasswordEncoder passwordEncoder;
    private final CronService cronService;
    private final EmailService emailService;
    private final PermissionService permissionService;
    private final com.flowforge.config.FlowForgeProperties properties;

    public List<WebhookResponse> listWebhooks(User user) {
        return webhookRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId(user)).stream().map(this::webhookResponse).toList();
    }

    @Transactional
    public WebhookResponse createWebhook(CreateWebhookRequest request, User user) {
        permissionService.require(user, "platform:write");
        Workflow workflow = workflowForOrg(request.workflowId(), user);
        Webhook webhook = Webhook.builder()
                .name(request.name())
                .workflow(workflow)
                .organization(user.getOrganization())
                .secret("whsec_" + UUID.randomUUID().toString().replace("-", ""))
                .build();
        webhook = webhookRepository.save(webhook);
        audit(user, "WEBHOOK_CREATED", ResourceType.WEBHOOK, webhook.getId(), webhook.getName(), "{\"workflowId\":" + workflow.getId() + "}");
        return webhookResponse(webhook);
    }

    @Transactional
    public WebhookResponse regenerateWebhookSecret(Long id, User user) {
        permissionService.require(user, "platform:write");
        Webhook webhook = webhookForOrg(id, user);
        webhook.setSecret("whsec_" + UUID.randomUUID().toString().replace("-", ""));
        webhook = webhookRepository.save(webhook);
        audit(user, "WEBHOOK_SECRET_REGENERATED", ResourceType.WEBHOOK, webhook.getId(), webhook.getName(), null);
        return webhookResponse(webhook);
    }

    @Transactional
    public void deleteWebhook(Long id, User user) {
        permissionService.require(user, "platform:write");
        Webhook webhook = webhookForOrg(id, user);
        webhookRepository.delete(webhook);
        audit(user, "WEBHOOK_DELETED", ResourceType.WEBHOOK, id, webhook.getName(), null);
    }

    @Transactional
    public ExecutionResponse triggerWebhook(String secret, String inputPayload) {
        Webhook webhook = webhookRepository.findBySecret(secret)
                .orElseThrow(() -> new ResourceNotFoundException("Webhook not found"));
        webhook.setHitCount(webhook.getHitCount() + 1);
        webhook.setLastTriggeredAt(Instant.now());
        webhookRepository.save(webhook);

        Execution execution = executionEngineService.run(webhook.getWorkflow(), webhook.getWorkflow().getOwner(), inputPayload);
        notificationRepository.save(AppNotification.builder()
                .organization(webhook.getOrganization())
                .title(execution.getStatus().name().equals("SUCCESS") ? "Webhook run completed" : "Webhook run failed")
                .message(webhook.getName() + " triggered " + webhook.getWorkflow().getName())
                .type(execution.getStatus().name().equals("SUCCESS") ? NotificationType.SUCCESS : NotificationType.FAILURE)
                .workflowId(webhook.getWorkflow().getId())
                .executionId(execution.getId())
                .build());
        audit(webhook.getWorkflow().getOwner(), "WEBHOOK_TRIGGERED", ResourceType.WEBHOOK, webhook.getId(), webhook.getName(), "{\"executionId\":" + execution.getId() + "}");
        return executionService.toResponse(execution);
    }

    public List<ScheduleResponse> listSchedules(User user) {
        return scheduleRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId(user)).stream().map(this::scheduleResponse).toList();
    }

    @Transactional
    public ScheduleResponse createSchedule(CreateScheduleRequest request, User user) {
        permissionService.require(user, "platform:write");
        Workflow workflow = workflowForOrg(request.workflowId(), user);
        ScheduleEntry schedule = ScheduleEntry.builder()
                .workflow(workflow)
                .organization(user.getOrganization())
                .cronExpression(request.cronExpression())
                .enabled(request.enabled())
                .nextRunAt(cronService.nextRun(request.cronExpression(), Instant.now()))
                .build();
        schedule = scheduleRepository.save(schedule);
        audit(user, "SCHEDULE_CREATED", ResourceType.WORKFLOW, workflow.getId(), workflow.getName(), "{\"cron\":\"" + request.cronExpression() + "\"}");
        return scheduleResponse(schedule);
    }

    @Transactional
    public ScheduleResponse updateSchedule(Long id, CreateScheduleRequest request, User user) {
        permissionService.require(user, "platform:write");
        ScheduleEntry schedule = scheduleForOrg(id, user);
        schedule.setWorkflow(workflowForOrg(request.workflowId(), user));
        schedule.setCronExpression(request.cronExpression());
        schedule.setEnabled(request.enabled());
        schedule.setNextRunAt(cronService.nextRun(request.cronExpression(), Instant.now()));
        schedule = scheduleRepository.save(schedule);
        audit(user, "SCHEDULE_UPDATED", ResourceType.WORKFLOW, schedule.getWorkflow().getId(), schedule.getWorkflow().getName(), "{\"scheduleId\":" + id + "}");
        return scheduleResponse(schedule);
    }

    @Transactional
    public void deleteSchedule(Long id, User user) {
        permissionService.require(user, "platform:write");
        ScheduleEntry schedule = scheduleForOrg(id, user);
        scheduleRepository.delete(schedule);
        audit(user, "SCHEDULE_DELETED", ResourceType.WORKFLOW, schedule.getWorkflow().getId(), schedule.getWorkflow().getName(), "{\"scheduleId\":" + id + "}");
    }

    public List<NotificationResponse> listNotifications(User user) {
        return notificationRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId(user)).stream().map(this::notificationResponse).toList();
    }

    @Transactional
    public NotificationResponse markNotificationRead(Long id, User user) {
        AppNotification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + id));
        ensureOrg(notification.getOrganization(), user);
        notification.setRead(true);
        return notificationResponse(notificationRepository.save(notification));
    }

    @Transactional
    public void markAllNotificationsRead(User user) {
        List<AppNotification> items = notificationRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId(user));
        items.forEach(item -> item.setRead(true));
        notificationRepository.saveAll(items);
    }

    public AuditPageResponse listAudit(User user, int page, int size, String resourceType, Instant from, Instant to) {
        Instant fromValue = from == null ? Instant.EPOCH : from;
        Instant toValue = to == null ? Instant.now().plusSeconds(86400) : to;
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<AuditLog> result;
        if (resourceType == null || resourceType.isBlank()) {
            result = auditRepository.findByOrganizationIdAndCreatedAtBetweenOrderByCreatedAtDesc(orgId(user), fromValue, toValue, pageRequest);
        } else {
            result = auditRepository.findByOrganizationIdAndResourceTypeAndCreatedAtBetweenOrderByCreatedAtDesc(orgId(user), ResourceType.valueOf(resourceType), fromValue, toValue, pageRequest);
        }
        return new AuditPageResponse(result.getContent().stream().map(this::auditResponse).toList(), result.getTotalElements(), result.getTotalPages());
    }

    public List<ApiKeyResponse> listApiKeys(User user) {
        return apiKeyRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId(user)).stream().map(this::apiKeyResponse).toList();
    }

    @Transactional
    public CreatedApiKeyResponse createApiKey(CreateApiKeyRequest request, User user) {
        permissionService.require(user, "apikey:manage");
        String fullKey = "ff_sk_" + UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        ApiKey key = ApiKey.builder()
                .organization(user.getOrganization())
                .createdBy(user)
                .name(request.name())
                .keyPrefix(fullKey.substring(0, 13) + "...")
                .keyHash(sha256(fullKey))
                .expiresAt(parseDate(request.expiresAt()))
                .build();
        key = apiKeyRepository.save(key);
        audit(user, "APIKEY_CREATED", ResourceType.APIKEY, key.getId(), key.getName(), null);
        return new CreatedApiKeyResponse(key.getId(), key.getName(), key.getKeyPrefix(), key.getCreatedAt(), key.getLastUsedAt(), key.getExpiresAt(), key.isActive(), fullKey);
    }

    @Transactional
    public void deleteApiKey(Long id, User user) {
        permissionService.require(user, "apikey:manage");
        ApiKey key = apiKeyRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("API key not found: " + id));
        ensureOrg(key.getOrganization(), user);
        key.setActive(false);
        apiKeyRepository.save(key);
        audit(user, "APIKEY_REVOKED", ResourceType.APIKEY, key.getId(), key.getName(), null);
    }

    public OrgResponse getOrg(User user) {
        Organization org = user.getOrganization();
        return new OrgResponse(org.getId(), org.getName(), org.getUsers().size(), org.getCreatedAt());
    }

    public List<TeamMemberResponse> listMembers(User user) {
        return userRepository.findAll().stream()
                .filter(member -> member.getOrganization() != null && member.getOrganization().getId().equals(orgId(user)))
                .map(this::teamMemberResponse)
                .toList();
    }

    @Transactional
    public TeamMemberResponse inviteMember(InviteMemberRequest request, User user) {
        permissionService.require(user, "team:manage");
        if (userRepository.existsByEmail(request.email().toLowerCase())) {
            throw new BadRequestException("An account with this email already exists");
        }
        String inviteToken = UUID.randomUUID().toString().replace("-", "");
        User member = User.builder()
                .fullName(request.email().split("@")[0])
                .email(request.email().toLowerCase())
                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                .inviteToken(inviteToken)
                .enabled(false)
                .organization(user.getOrganization())
                .roles(Set.of(roleFor(request.role())))
                .build();
        member = userRepository.save(member);
        audit(user, "USER_INVITED", ResourceType.USER, member.getId(), member.getEmail(), "{\"role\":\"" + request.role() + "\",\"inviteToken\":\"" + inviteToken + "\"}");
        emailService.send(member.getEmail(), "You're invited to FlowForge", "Accept your invite: " + properties.getApp().getFrontendUrl() + "/accept-invite?token=" + inviteToken);
        return teamMemberResponse(member);
    }

    @Transactional
    public TeamMemberResponse updateMemberRole(Long id, UpdateMemberRoleRequest request, User user) {
        permissionService.require(user, "team:manage");
        User member = memberForOrg(id, user);
        member.setRoles(Set.of(roleFor(request.role())));
        member = userRepository.save(member);
        audit(user, "USER_ROLE_UPDATED", ResourceType.USER, member.getId(), member.getEmail(), "{\"role\":\"" + request.role() + "\"}");
        return teamMemberResponse(member);
    }

    @Transactional
    public void removeMember(Long id, User user) {
        permissionService.require(user, "team:manage");
        if (id.equals(user.getId())) throw new BadRequestException("You cannot remove yourself");
        User member = memberForOrg(id, user);
        userRepository.delete(member);
        audit(user, "USER_REMOVED", ResourceType.USER, id, member.getEmail(), null);
    }

    private Workflow workflowForOrg(Long workflowId, User user) {
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found: " + workflowId));
        ensureOrg(workflow.getOrganization(), user);
        return workflow;
    }

    private Webhook webhookForOrg(Long id, User user) {
        Webhook webhook = webhookRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Webhook not found: " + id));
        ensureOrg(webhook.getOrganization(), user);
        return webhook;
    }

    private ScheduleEntry scheduleForOrg(Long id, User user) {
        ScheduleEntry schedule = scheduleRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Schedule not found: " + id));
        ensureOrg(schedule.getOrganization(), user);
        return schedule;
    }

    private User memberForOrg(Long id, User user) {
        User member = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Member not found: " + id));
        if (member.getOrganization() == null || !member.getOrganization().getId().equals(orgId(user))) {
            throw new AccessDeniedAppException("You do not have access to this member");
        }
        return member;
    }

    private void ensureOrg(Organization organization, User user) {
        if (organization == null || !organization.getId().equals(orgId(user))) {
            throw new AccessDeniedAppException("You do not have access to this resource");
        }
    }

    private Long orgId(User user) {
        if (user.getOrganization() == null) throw new BadRequestException("User has no organization");
        return user.getOrganization().getId();
    }

    private Role roleFor(String role) {
        RoleName roleName = "ADMIN".equalsIgnoreCase(role) ? RoleName.ROLE_ADMIN : RoleName.ROLE_EDITOR;
        return roleRepository.findByName(roleName).orElseThrow(() -> new IllegalStateException(roleName + " not seeded"));
    }

    private void requireAdmin(User user) {
        if (!hasRole(user, RoleName.ROLE_ADMIN)) {
            throw new AccessDeniedAppException("Admin role required");
        }
    }

    private void requireEditor(User user) {
        if (!hasRole(user, RoleName.ROLE_ADMIN) && !hasRole(user, RoleName.ROLE_EDITOR)) {
            throw new AccessDeniedAppException("Editor role required");
        }
    }

    private boolean hasRole(User user, RoleName roleName) {
        return user.getRoles().stream().anyMatch(role -> role.getName() == roleName);
    }

    private WebhookResponse webhookResponse(Webhook webhook) {
        return new WebhookResponse(webhook.getId(), webhook.getName(), webhook.getWorkflow().getId(), webhook.getWorkflow().getName(), webhook.getSecret(), "http://localhost:8080/api/webhooks/" + webhook.getSecret() + "/trigger", webhook.getCreatedAt(), webhook.getHitCount(), webhook.getLastTriggeredAt());
    }

    private ScheduleResponse scheduleResponse(ScheduleEntry schedule) {
        return new ScheduleResponse(schedule.getId(), schedule.getWorkflow().getId(), schedule.getWorkflow().getName(), schedule.getCronExpression(), schedule.isEnabled(), schedule.getNextRunAt(), schedule.getLastRunAt(), schedule.getLastStatus());
    }

    private NotificationResponse notificationResponse(AppNotification notification) {
        return new NotificationResponse(notification.getId(), notification.getTitle(), notification.getMessage(), notification.getType(), notification.getWorkflowId(), notification.getExecutionId(), notification.isRead(), notification.getCreatedAt());
    }

    private AuditResponse auditResponse(AuditLog audit) {
        return AuditResponse.builder()
                .id(audit.getId())
                .action(audit.getAction())
                .resourceType(audit.getResourceType())
                .resourceId(audit.getResourceId())
                .resourceName(audit.getResourceName())
                .userId(audit.getUser().getId())
                .userEmail(audit.getUser().getEmail())
                .metadata(audit.getMetadata())
                .createdAt(audit.getCreatedAt())
                .build();
    }

    private ApiKeyResponse apiKeyResponse(ApiKey key) {
        return new ApiKeyResponse(key.getId(), key.getName(), key.getKeyPrefix(), key.getCreatedAt(), key.getLastUsedAt(), key.getExpiresAt(), key.isActive());
    }

    private TeamMemberResponse teamMemberResponse(User member) {
        String memberRole = member.getRoles().stream().anyMatch(userRole -> userRole.getName() == RoleName.ROLE_ADMIN) ? "ADMIN" : "USER";
        return new TeamMemberResponse(member.getId(), member.getFullName(), member.getEmail(), memberRole, member.getCreatedAt(), null);
    }

    private void audit(User user, String action, ResourceType type, Long resourceId, String resourceName, String metadata) {
        auditRepository.save(AuditLog.builder()
                .organization(user.getOrganization())
                .user(user)
                .action(action)
                .resourceType(type)
                .resourceId(resourceId)
                .resourceName(resourceName)
                .metadata(metadata)
                .build());
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 not available", ex);
        }
    }

    private Instant parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        return LocalDate.parse(value).atStartOfDay().toInstant(ZoneOffset.UTC);
    }
}
