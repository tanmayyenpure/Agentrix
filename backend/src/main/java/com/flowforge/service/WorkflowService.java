package com.flowforge.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.flowforge.dto.EdgeDto;
import com.flowforge.dto.NodeDto;
import com.flowforge.dto.WorkflowRequest;
import com.flowforge.dto.WorkflowResponse;
import com.flowforge.dto.WorkflowVersionResponse;
import com.flowforge.exception.AccessDeniedAppException;
import com.flowforge.exception.ResourceNotFoundException;
import com.flowforge.model.User;
import com.flowforge.model.Workflow;
import com.flowforge.model.WorkflowEdge;
import com.flowforge.model.WorkflowNode;
import com.flowforge.model.WorkflowVersion;
import com.flowforge.repository.WorkflowRepository;
import com.flowforge.repository.WorkflowVersionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final WorkflowRepository workflowRepository;
    private final WorkflowVersionRepository workflowVersionRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public WorkflowResponse create(WorkflowRequest request, User owner) {
        Workflow workflow = Workflow.builder()
                .name(request.getName())
                .description(request.getDescription())
                .active(request.isActive())
                .owner(owner)
                .organization(owner.getOrganization())
                .build();

        applyGraph(workflow, request.getNodes(), request.getEdges());

        workflow = workflowRepository.save(workflow);
        saveVersion(workflow, owner);
        return toResponse(workflow);
    }

    @Transactional
    public WorkflowResponse update(Long workflowId, WorkflowRequest request, User requester) {
        Workflow workflow = getOwnedWorkflow(workflowId, requester);

        workflow.setName(request.getName());
        workflow.setDescription(request.getDescription());
        workflow.setActive(request.isActive());
        workflow.setVersion(workflow.getVersion() + 1);

        workflow.getNodes().clear();
        workflow.getEdges().clear();
        applyGraph(workflow, request.getNodes(), request.getEdges());

        workflow = workflowRepository.save(workflow);
        saveVersion(workflow, requester);
        return toResponse(workflow);
    }

    public List<WorkflowVersionResponse> listVersions(Long workflowId, User requester) {
        Workflow workflow = getOwnedWorkflow(workflowId, requester);
        return workflowVersionRepository.findByWorkflowIdOrderByVersionDesc(workflow.getId()).stream()
                .map(this::toVersionResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public WorkflowResponse rollback(Long workflowId, int version, User requester) {
        Workflow workflow = getOwnedWorkflow(workflowId, requester);
        WorkflowVersion snapshot = workflowVersionRepository.findByWorkflowIdAndVersion(workflow.getId(), version)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow version not found: " + version));
        workflow.setName(snapshot.getName());
        workflow.setDescription(snapshot.getDescription());
        workflow.setActive(snapshot.isActive());
        workflow.setVersion(workflow.getVersion() + 1);
        workflow.getNodes().clear();
        workflow.getEdges().clear();
        applyGraph(workflow, readNodes(snapshot.getNodesJson()), readEdges(snapshot.getEdgesJson()));
        workflow = workflowRepository.save(workflow);
        saveVersion(workflow, requester);
        return toResponse(workflow);
    }

    public WorkflowResponse get(Long workflowId, User requester) {
        return toResponse(getOwnedWorkflow(workflowId, requester));
    }

    public List<WorkflowResponse> listForUser(User requester) {
        return workflowRepository.findByOrganizationId(requester.getOrganization().getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void delete(Long workflowId, User requester) {
        Workflow workflow = getOwnedWorkflow(workflowId, requester);
        workflowVersionRepository.deleteByWorkflowId(workflow.getId());
        workflowRepository.delete(workflow);
    }

    /** Package-private: used by services that need org-scoped workflow access. */
    Workflow getOwnedWorkflow(Long workflowId, User requester) {
        Workflow workflow = workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow not found: " + workflowId));
        if (workflow.getOrganization() == null || requester.getOrganization() == null
                || !workflow.getOrganization().getId().equals(requester.getOrganization().getId())) {
            throw new AccessDeniedAppException("You do not have access to this workflow");
        }
        return workflow;
    }

    private void applyGraph(Workflow workflow, List<NodeDto> nodeDtos, List<EdgeDto> edgeDtos) {
        List<WorkflowNode> nodes = new ArrayList<>();
        for (NodeDto dto : nodeDtos) {
            nodes.add(WorkflowNode.builder()
                    .clientId(dto.getClientId())
                    .workflow(workflow)
                    .type(dto.getType())
                    .label(dto.getLabel())
                    .config(dto.getConfig())
                    .positionX(dto.getPositionX())
                    .positionY(dto.getPositionY())
                    .build());
        }
        workflow.getNodes().addAll(nodes);

        List<WorkflowEdge> edges = new ArrayList<>();
        for (EdgeDto dto : edgeDtos) {
            edges.add(WorkflowEdge.builder()
                    .workflow(workflow)
                    .sourceClientId(dto.getSourceClientId())
                    .targetClientId(dto.getTargetClientId())
                    .conditionBranch(dto.getConditionBranch())
                    .build());
        }
        workflow.getEdges().addAll(edges);
    }

    WorkflowResponse toResponse(Workflow workflow) {
        List<NodeDto> nodes = workflow.getNodes().stream().map(n -> {
            NodeDto dto = new NodeDto();
            dto.setClientId(n.getClientId());
            dto.setType(n.getType());
            dto.setLabel(n.getLabel());
            dto.setConfig(n.getConfig());
            dto.setPositionX(n.getPositionX());
            dto.setPositionY(n.getPositionY());
            return dto;
        }).collect(Collectors.toList());

        List<EdgeDto> edges = workflow.getEdges().stream().map(e -> {
            EdgeDto dto = new EdgeDto();
            dto.setSourceClientId(e.getSourceClientId());
            dto.setTargetClientId(e.getTargetClientId());
            dto.setConditionBranch(e.getConditionBranch());
            return dto;
        }).collect(Collectors.toList());

        return WorkflowResponse.builder()
                .id(workflow.getId())
                .name(workflow.getName())
                .description(workflow.getDescription())
                .active(workflow.isActive())
                .version(workflow.getVersion())
                .ownerId(workflow.getOwner().getId())
                .nodes(nodes)
                .edges(edges)
                .createdAt(workflow.getCreatedAt())
                .updatedAt(workflow.getUpdatedAt())
                .build();
    }

    private void saveVersion(Workflow workflow, User user) {
        try {
            List<NodeDto> nodes = workflow.getNodes().stream().map(n -> {
                NodeDto dto = new NodeDto();
                dto.setClientId(n.getClientId());
                dto.setType(n.getType());
                dto.setLabel(n.getLabel());
                dto.setConfig(n.getConfig());
                dto.setPositionX(n.getPositionX());
                dto.setPositionY(n.getPositionY());
                return dto;
            }).collect(Collectors.toList());
            List<EdgeDto> edges = workflow.getEdges().stream().map(e -> {
                EdgeDto dto = new EdgeDto();
                dto.setSourceClientId(e.getSourceClientId());
                dto.setTargetClientId(e.getTargetClientId());
                dto.setConditionBranch(e.getConditionBranch());
                return dto;
            }).collect(Collectors.toList());
            workflowVersionRepository.save(WorkflowVersion.builder()
                    .workflow(workflow)
                    .version(workflow.getVersion())
                    .name(workflow.getName())
                    .description(workflow.getDescription())
                    .active(workflow.isActive())
                    .nodesJson(objectMapper.writeValueAsString(nodes))
                    .edgesJson(objectMapper.writeValueAsString(edges))
                    .createdBy(user)
                    .build());
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to save workflow version", ex);
        }
    }

    private List<NodeDto> readNodes(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<List<NodeDto>>() {});
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to read workflow nodes snapshot", ex);
        }
    }

    private List<EdgeDto> readEdges(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<List<EdgeDto>>() {});
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to read workflow edges snapshot", ex);
        }
    }

    private WorkflowVersionResponse toVersionResponse(WorkflowVersion version) {
        return WorkflowVersionResponse.builder()
                .id(version.getId())
                .workflowId(version.getWorkflow().getId())
                .version(version.getVersion())
                .name(version.getName())
                .createdByUserId(version.getCreatedBy().getId())
                .createdByEmail(version.getCreatedBy().getEmail())
                .createdAt(version.getCreatedAt())
                .build();
    }
}
