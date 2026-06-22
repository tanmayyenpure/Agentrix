package com.flowforge.controller;

import com.flowforge.dto.AiDtos.*;
import com.flowforge.dto.ConnectorCredentialDtos.*;
import com.flowforge.dto.WorkflowResponse;
import com.flowforge.model.User;
import com.flowforge.security.CustomUserDetails;
import com.flowforge.service.AiAutomationService;
import com.flowforge.service.ConnectorCredentialService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class AiAutomationController {
    private final AiAutomationService aiAutomationService;
    private final ConnectorCredentialService connectorCredentialService;

    @PostMapping("/api/ai/workflows/generate")
    public GeneratedWorkflowResponse generateWorkflow(@Valid @RequestBody GenerateWorkflowRequest request, @AuthenticationPrincipal CustomUserDetails principal) {
        return aiAutomationService.generateWorkflow(request, currentUser(principal));
    }

    @GetMapping("/api/ai/agents")
    public List<AiAgentResponse> listAgents(@AuthenticationPrincipal CustomUserDetails principal) {
        return aiAutomationService.listAgents(currentUser(principal));
    }

    @PostMapping("/api/ai/agents")
    public ResponseEntity<AiAgentResponse> createAgent(@Valid @RequestBody CreateAgentRequest request, @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(aiAutomationService.createAgent(request, currentUser(principal)));
    }

    @PutMapping("/api/ai/agents/{id}")
    public AiAgentResponse updateAgent(@PathVariable Long id, @Valid @RequestBody CreateAgentRequest request, @AuthenticationPrincipal CustomUserDetails principal) {
        return aiAutomationService.updateAgent(id, request, currentUser(principal));
    }

    @DeleteMapping("/api/ai/agents/{id}")
    public ResponseEntity<Void> deleteAgent(@PathVariable Long id, @AuthenticationPrincipal CustomUserDetails principal) {
        aiAutomationService.deleteAgent(id, currentUser(principal));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/ai/agents/{id}/run")
    public AgentRunResponse runAgent(@PathVariable Long id, @Valid @RequestBody RunAgentRequest request, @AuthenticationPrincipal CustomUserDetails principal) {
        return aiAutomationService.runAgent(id, request, currentUser(principal));
    }

    @GetMapping("/api/connectors")
    public List<ConnectorResponse> listConnectors() {
        return aiAutomationService.listConnectors();
    }

    @PostMapping("/api/connectors/{slug}/install")
    public WorkflowResponse installConnector(@PathVariable String slug, @RequestBody(required = false) InstallConnectorRequest request, @AuthenticationPrincipal CustomUserDetails principal) {
        return aiAutomationService.installConnector(slug, request == null ? new InstallConnectorRequest(null) : request, currentUser(principal));
    }

    @GetMapping("/api/connectors/{slug}/credentials")
    public List<ConnectorCredentialResponse> listCredentials(@PathVariable String slug, @AuthenticationPrincipal CustomUserDetails principal) {
        return connectorCredentialService.list(slug, currentUser(principal));
    }

    @PostMapping("/api/connectors/{slug}/credentials")
    public ConnectorCredentialResponse saveCredential(@PathVariable String slug, @Valid @RequestBody SaveConnectorCredentialRequest request, @AuthenticationPrincipal CustomUserDetails principal) {
        return connectorCredentialService.save(slug, request, currentUser(principal));
    }

    @PostMapping("/api/connectors/{slug}/oauth/start")
    public OAuthStartResponse startOAuth(@PathVariable String slug, @AuthenticationPrincipal CustomUserDetails principal) {
        return connectorCredentialService.startOAuth(slug, currentUser(principal));
    }

    private User currentUser(CustomUserDetails principal) {
        return principal.getUser();
    }
}
