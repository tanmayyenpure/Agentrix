package com.flowforge.controller;

import com.flowforge.dto.ExecutionResponse;
import com.flowforge.dto.TriggerExecutionRequest;
import com.flowforge.model.User;
import com.flowforge.security.CustomUserDetails;
import com.flowforge.service.ExecutionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ExecutionController {

    private final ExecutionService executionService;

    @PostMapping("/api/workflows/{workflowId}/executions")
    public ResponseEntity<ExecutionResponse> trigger(
            @PathVariable Long workflowId,
            @RequestBody(required = false) TriggerExecutionRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        String payload = request != null ? request.getInputPayload() : null;
        ExecutionResponse response = executionService.trigger(workflowId, payload, currentUser(principal));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/api/workflows/{workflowId}/executions")
    public ResponseEntity<List<ExecutionResponse>> list(
            @PathVariable Long workflowId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(executionService.listForWorkflow(workflowId, currentUser(principal)));
    }

    @GetMapping("/api/executions/{executionId}")
    public ResponseEntity<ExecutionResponse> get(
            @PathVariable Long executionId,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(executionService.get(executionId, currentUser(principal)));
    }

    private User currentUser(CustomUserDetails principal) {
        return principal.getUser();
    }
}
