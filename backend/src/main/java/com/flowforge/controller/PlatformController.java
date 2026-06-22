package com.flowforge.controller;

import com.flowforge.dto.ExecutionResponse;
import com.flowforge.dto.PlatformDtos.*;
import com.flowforge.model.User;
import com.flowforge.security.CustomUserDetails;
import com.flowforge.service.PlatformService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class PlatformController {
    private final PlatformService platformService;

    @GetMapping("/api/webhooks")
    public List<WebhookResponse> listWebhooks(@AuthenticationPrincipal CustomUserDetails principal) {
        return platformService.listWebhooks(currentUser(principal));
    }

    @PostMapping("/api/webhooks")
    public ResponseEntity<WebhookResponse> createWebhook(@Valid @RequestBody CreateWebhookRequest request, @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(platformService.createWebhook(request, currentUser(principal)));
    }

    @DeleteMapping("/api/webhooks/{id}")
    public ResponseEntity<Void> deleteWebhook(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails principal) {
        platformService.deleteWebhook(id, currentUser(principal));
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/api/webhooks/{id}/regenerate-secret")
    public WebhookResponse regenerateWebhookSecret(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails principal) {
        return platformService.regenerateWebhookSecret(id, currentUser(principal));
    }

    @PostMapping("/api/webhooks/{secret}/trigger")
    public ExecutionResponse triggerWebhook(@PathVariable String secret, @RequestBody(required = false) String body) {
        return platformService.triggerWebhook(secret, body);
    }

    @GetMapping("/api/schedules")
    public List<ScheduleResponse> listSchedules(@AuthenticationPrincipal CustomUserDetails principal) {
        return platformService.listSchedules(currentUser(principal));
    }

    @PostMapping("/api/schedules")
    public ResponseEntity<ScheduleResponse> createSchedule(@Valid @RequestBody CreateScheduleRequest request, @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(platformService.createSchedule(request, currentUser(principal)));
    }

    @PutMapping("/api/schedules/{id}")
    public ScheduleResponse updateSchedule(@PathVariable Long id, @Valid @RequestBody CreateScheduleRequest request, @AuthenticationPrincipal CustomUserDetails principal) {
        return platformService.updateSchedule(id, request, currentUser(principal));
    }

    @DeleteMapping("/api/schedules/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails principal) {
        platformService.deleteSchedule(id, currentUser(principal));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/notifications")
    public List<NotificationResponse> listNotifications(@AuthenticationPrincipal CustomUserDetails principal) {
        return platformService.listNotifications(currentUser(principal));
    }

    @PutMapping("/api/notifications/{id}/read")
    public NotificationResponse markNotificationRead(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails principal) {
        return platformService.markNotificationRead(id, currentUser(principal));
    }

    @PutMapping("/api/notifications/read-all")
    public ResponseEntity<Void> markAllNotificationsRead(@AuthenticationPrincipal CustomUserDetails principal) {
        platformService.markAllNotificationsRead(currentUser(principal));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/audit")
    public AuditPageResponse listAudit(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String resourceType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @AuthenticationPrincipal CustomUserDetails principal) {
        Instant fromInstant = from == null ? null : from.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant toInstant = to == null ? null : to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        return platformService.listAudit(currentUser(principal), page, size, resourceType, fromInstant, toInstant);
    }

    @GetMapping("/api/apikeys")
    public List<ApiKeyResponse> listApiKeys(@AuthenticationPrincipal CustomUserDetails principal) {
        return platformService.listApiKeys(currentUser(principal));
    }

    @PostMapping("/api/apikeys")
    public ResponseEntity<CreatedApiKeyResponse> createApiKey(@Valid @RequestBody CreateApiKeyRequest request, @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(platformService.createApiKey(request, currentUser(principal)));
    }

    @DeleteMapping("/api/apikeys/{id}")
    public ResponseEntity<Void> deleteApiKey(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails principal) {
        platformService.deleteApiKey(id, currentUser(principal));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/org")
    public OrgResponse getOrg(@AuthenticationPrincipal CustomUserDetails principal) {
        return platformService.getOrg(currentUser(principal));
    }

    @GetMapping("/api/org/members")
    public List<TeamMemberResponse> listMembers(@AuthenticationPrincipal CustomUserDetails principal) {
        return platformService.listMembers(currentUser(principal));
    }

    @PostMapping("/api/org/invite")
    public ResponseEntity<TeamMemberResponse> inviteMember(@Valid @RequestBody InviteMemberRequest request, @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(platformService.inviteMember(request, currentUser(principal)));
    }

    @PutMapping("/api/org/members/{id}/role")
    public TeamMemberResponse updateMemberRole(@PathVariable Long id, @Valid @RequestBody UpdateMemberRoleRequest request, @AuthenticationPrincipal CustomUserDetails principal) {
        return platformService.updateMemberRole(id, request, currentUser(principal));
    }

    @DeleteMapping("/api/org/members/{id}")
    public ResponseEntity<Void> removeMember(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails principal) {
        platformService.removeMember(id, currentUser(principal));
        return ResponseEntity.noContent().build();
    }

    private User currentUser(CustomUserDetails principal) {
        return principal.getUser();
    }
}
