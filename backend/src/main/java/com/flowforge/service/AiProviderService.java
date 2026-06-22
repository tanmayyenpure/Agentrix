package com.flowforge.service;

import com.flowforge.config.FlowForgeProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Service
@RequiredArgsConstructor
public class AiProviderService {
    private final FlowForgeProperties properties;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public String complete(String system, String user) {
        String provider = properties.getAi().getProvider();
        try {
            if ("openai".equalsIgnoreCase(provider) && !properties.getAi().getOpenaiApiKey().isBlank()) {
                return callOpenAi(system, user);
            }
            if ("anthropic".equalsIgnoreCase(provider) && !properties.getAi().getAnthropicApiKey().isBlank()) {
                return callAnthropic(system, user);
            }
        } catch (Exception ex) {
            return "AI provider call failed, using local fallback: " + ex.getMessage();
        }
        return "Local AI fallback: " + user;
    }

    private String callOpenAi(String system, String user) throws Exception {
        String body = """
                {"model":"%s","messages":[{"role":"system","content":%s},{"role":"user","content":%s}],"temperature":0.2}
                """.formatted(properties.getAi().getModel(), quote(system), quote(user));
        HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.openai.com/v1/chat/completions"))
                .header("Authorization", "Bearer " + properties.getAi().getOpenaiApiKey())
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString()).body();
    }

    private String callAnthropic(String system, String user) throws Exception {
        String body = """
                {"model":"%s","max_tokens":800,"system":%s,"messages":[{"role":"user","content":%s}]}
                """.formatted(properties.getAi().getModel(), quote(system), quote(user));
        HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.anthropic.com/v1/messages"))
                .header("x-api-key", properties.getAi().getAnthropicApiKey())
                .header("anthropic-version", "2023-06-01")
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        return httpClient.send(request, HttpResponse.BodyHandlers.ofString()).body();
    }

    private String quote(String value) {
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n") + "\"";
    }
}
