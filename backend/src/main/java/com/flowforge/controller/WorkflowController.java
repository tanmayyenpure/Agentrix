package com.flowforge.controller;

import com.flowforge.dto.WorkflowRequest;
import com.flowforge.dto.WorkflowResponse;
import com.flowforge.dto.WorkflowVersionResponse;
import com.flowforge.model.User;
import com.flowforge.security.CustomUserDetails;
import com.flowforge.service.WorkflowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/workflows")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowService workflowService;

    @PostMapping
    public ResponseEntity<WorkflowResponse> create(
            @Valid @RequestBody WorkflowRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(workflowService.create(request, currentUser(principal)));
    }

    @GetMapping
    public ResponseEntity<List<WorkflowResponse>> list(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(workflowService.listForUser(currentUser(principal)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkflowResponse> get(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(workflowService.get(id, currentUser(principal)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkflowResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody WorkflowRequest request,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(workflowService.update(id, request, currentUser(principal)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal) {
        workflowService.delete(id, currentUser(principal));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/versions")
    public ResponseEntity<List<WorkflowVersionResponse>> versions(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(workflowService.listVersions(id, currentUser(principal)));
    }

    @PostMapping("/{id}/versions/{version}/rollback")
    public ResponseEntity<WorkflowResponse> rollback(
            @PathVariable Long id,
            @PathVariable int version,
            @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(workflowService.rollback(id, version, currentUser(principal)));
    }

    private User currentUser(CustomUserDetails principal) {
        return principal.getUser();
    }
}
