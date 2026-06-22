package com.flowforge.service.execution;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.flowforge.model.WorkflowNode;
import com.flowforge.model.enums.NodeType;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

/**
 * Performs an outbound HTTP call. Config example:
 * {"url": "https://api.example.com/notify", "method": "POST", "body": "{\"hello\":\"world\"}"}
 */
@Component
public class HttpRequestNodeExecutor implements NodeExecutor {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public NodeType supportedType() {
        return NodeType.HTTP_REQUEST;
    }

    @Override
    public NodeExecutionResult execute(WorkflowNode node, ExecutionContext context) {
        if (node.getConfig() == null) {
            return NodeExecutionResult.builder().success(false).errorMessage("Missing HTTP_REQUEST config").build();
        }
        try {
            JsonNode cfg = objectMapper.readTree(node.getConfig());
            String url = cfg.path("url").asText(null);
            if (url == null || url.isBlank()) {
                return NodeExecutionResult.builder().success(false).errorMessage("HTTP_REQUEST config missing 'url'").build();
            }
            HttpMethod method = HttpMethod.valueOf(cfg.path("method").asText("GET").toUpperCase());
            String body = cfg.has("body") ? cfg.get("body").toString() : null;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.exchange(url, method, entity, String.class);

            return NodeExecutionResult.builder()
                    .success(response.getStatusCode().is2xxSuccessful())
                    .output(response.getBody())
                    .build();
        } catch (RestClientException rce) {
            return NodeExecutionResult.builder().success(false).errorMessage("HTTP call failed: " + rce.getMessage()).build();
        } catch (Exception e) {
            return NodeExecutionResult.builder().success(false).errorMessage("Invalid HTTP_REQUEST config: " + e.getMessage()).build();
        }
    }
}
