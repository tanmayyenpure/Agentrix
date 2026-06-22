package com.flowforge.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.flowforge.dto.AiDtos.*;
import com.flowforge.dto.EdgeDto;
import com.flowforge.dto.NodeDto;
import com.flowforge.dto.WorkflowRequest;
import com.flowforge.dto.WorkflowResponse;
import com.flowforge.exception.AccessDeniedAppException;
import com.flowforge.exception.ResourceNotFoundException;
import com.flowforge.model.AiAgent;
import com.flowforge.model.IntegrationConnector;
import com.flowforge.model.User;
import com.flowforge.model.enums.NodeType;
import com.flowforge.repository.AiAgentRepository;
import com.flowforge.repository.IntegrationConnectorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AiAutomationService {
    private final WorkflowService workflowService;
    private final AiAgentRepository aiAgentRepository;
    private final IntegrationConnectorRepository connectorRepository;
    private final ObjectMapper objectMapper;
    private final AiProviderService aiProviderService;
    private final PermissionService permissionService;

    @Transactional
    public GeneratedWorkflowResponse generateWorkflow(GenerateWorkflowRequest request, User user) {
        WorkflowRequest workflow = buildWorkflow(request.prompt(), request.name());
        String providerSummary = aiProviderService.complete("Generate a concise workflow design summary.", request.prompt());
        Long workflowId = null;
        if (request.createWorkflow()) {
            WorkflowResponse created = workflowService.create(workflow, user);
            workflowId = created.getId();
        }
        return new GeneratedWorkflowResponse(
                workflow.getName(),
                workflow.getDescription(),
                workflow.getNodes(),
                workflow.getEdges(),
                workflowId,
                "Generated a workflow draft with " + workflow.getNodes().size() + " nodes. Provider note: " + providerSummary
        );
    }

    public List<AiAgentResponse> listAgents(User user) {
        return aiAgentRepository.findByOrganizationIdOrderByCreatedAtDesc(user.getOrganization().getId()).stream().map(this::agentResponse).toList();
    }

    @Transactional
    public AiAgentResponse createAgent(CreateAgentRequest request, User user) {
        permissionService.require(user, "agent:manage");
        AiAgent agent = AiAgent.builder()
                .organization(user.getOrganization())
                .createdBy(user)
                .name(request.name())
                .instructions(request.instructions())
                .model(request.model() == null || request.model().isBlank() ? "flowforge-rules-v1" : request.model())
                .enabled(request.enabled())
                .build();
        return agentResponse(aiAgentRepository.save(agent));
    }

    @Transactional
    public AiAgentResponse updateAgent(Long id, CreateAgentRequest request, User user) {
        permissionService.require(user, "agent:manage");
        AiAgent agent = agentForOrg(id, user);
        agent.setName(request.name());
        agent.setInstructions(request.instructions());
        agent.setModel(request.model() == null || request.model().isBlank() ? agent.getModel() : request.model());
        agent.setEnabled(request.enabled());
        return agentResponse(aiAgentRepository.save(agent));
    }

    @Transactional
    public void deleteAgent(Long id, User user) {
        permissionService.require(user, "agent:manage");
        aiAgentRepository.delete(agentForOrg(id, user));
    }

    public AgentRunResponse runAgent(Long id, RunAgentRequest request, User user) {
        AiAgent agent = agentForOrg(id, user);
        if (!agent.isEnabled()) throw new AccessDeniedAppException("Agent is disabled");
        String providerOutput = aiProviderService.complete(agent.getInstructions(), request.input());
        String output = providerOutput.startsWith("Local AI fallback:")
                ? "Agent " + agent.getName() + " reviewed the input using instructions: " + agent.getInstructions() + "\n\nRecommended next step: " + recommendation(request.input())
                : providerOutput;
        return new AgentRunResponse(agent.getId(), output, Instant.now());
    }

    public List<ConnectorResponse> listConnectors() {
        return connectorRepository.findAllByOrderByCategoryAscNameAsc().stream().map(this::connectorResponse).toList();
    }

    @Transactional
    public WorkflowResponse installConnector(String slug, InstallConnectorRequest request, User user) {
        permissionService.require(user, "connector:install");
        IntegrationConnector connector = connectorRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Connector not found: " + slug));
        try {
            WorkflowRequest workflow = objectMapper.readValue(connector.getTemplateJson(), WorkflowRequest.class);
            if (request.workflowName() != null && !request.workflowName().isBlank()) {
                workflow.setName(request.workflowName());
            }
            return workflowService.create(workflow, user);
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to install connector template", ex);
        }
    }

    private WorkflowRequest buildWorkflow(String prompt, String requestedName) {
        String lower = prompt.toLowerCase();
        WorkflowRequest request = new WorkflowRequest();
        request.setName(requestedName == null || requestedName.isBlank() ? titleFromPrompt(prompt) : requestedName);
        request.setDescription("AI-generated draft: " + prompt);

        List<NodeDto> nodes = new ArrayList<>();
        List<EdgeDto> edges = new ArrayList<>();
        nodes.add(node("trigger", NodeType.TRIGGER_MANUAL, "Manual trigger", null, 80, 120));
        String previous = "trigger";

        if (lower.contains("webhook")) {
            nodes.set(0, node("trigger", NodeType.TRIGGER_WEBHOOK, "Webhook trigger", null, 80, 120));
        }
        if (lower.contains("schedule") || lower.contains("daily") || lower.contains("weekly")) {
            nodes.set(0, node("trigger", NodeType.TRIGGER_SCHEDULE, "Schedule trigger", "0 9 * * *", 80, 120));
        }
        if (lower.contains("http") || lower.contains("api") || lower.contains("slack") || lower.contains("crm")) {
            nodes.add(node("http", NodeType.HTTP_REQUEST, "Call integration API", "{\"url\":\"https://api.example.com/endpoint\",\"method\":\"POST\"}", 360, 120));
            edges.add(edge(previous, "http"));
            previous = "http";
        }
        if (lower.contains("condition") || lower.contains("if ") || lower.contains("failed")) {
            nodes.add(node("condition", NodeType.CONDITION, "Check condition", "{\"operator\":\"contains\",\"value\":\"success\"}", 640, 120));
            edges.add(edge(previous, "condition"));
            previous = "condition";
        }
        nodes.add(node("log", NodeType.LOG, "Record result", "{\"message\":\"Workflow completed\"}", 920, 120));
        edges.add(edge(previous, "log"));

        request.setNodes(nodes);
        request.setEdges(edges);
        return request;
    }

    private NodeDto node(String id, NodeType type, String label, String config, double x, double y) {
        NodeDto node = new NodeDto();
        node.setClientId(id);
        node.setType(type);
        node.setLabel(label);
        node.setConfig(config);
        node.setPositionX(x);
        node.setPositionY(y);
        return node;
    }

    private EdgeDto edge(String source, String target) {
        EdgeDto edge = new EdgeDto();
        edge.setSourceClientId(source);
        edge.setTargetClientId(target);
        return edge;
    }

    private String titleFromPrompt(String prompt) {
        String clean = prompt.replaceAll("[^A-Za-z0-9 ]", "").trim();
        if (clean.isBlank()) return "AI Generated Workflow";
        return clean.length() > 48 ? clean.substring(0, 48) : clean;
    }

    private String recommendation(String input) {
        String lower = input.toLowerCase();
        if (lower.contains("error") || lower.contains("fail")) return "open the failed execution, inspect logs, and notify the workflow owner.";
        if (lower.contains("lead") || lower.contains("customer")) return "route the item through CRM enrichment and create a follow-up task.";
        return "summarize the payload, validate required fields, and continue the workflow.";
    }

    private AiAgent agentForOrg(Long id, User user) {
        AiAgent agent = aiAgentRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Agent not found: " + id));
        if (!agent.getOrganization().getId().equals(user.getOrganization().getId())) {
            throw new AccessDeniedAppException("You do not have access to this agent");
        }
        return agent;
    }

    private AiAgentResponse agentResponse(AiAgent agent) {
        return AiAgentResponse.builder()
                .id(agent.getId())
                .name(agent.getName())
                .instructions(agent.getInstructions())
                .model(agent.getModel())
                .enabled(agent.isEnabled())
                .createdAt(agent.getCreatedAt())
                .updatedAt(agent.getUpdatedAt())
                .build();
    }

    private ConnectorResponse connectorResponse(IntegrationConnector connector) {
        return new ConnectorResponse(connector.getId(), connector.getSlug(), connector.getName(), connector.getCategory(), connector.getDescription(), connector.getAuthType(), connector.isInstalledByDefault());
    }
}
