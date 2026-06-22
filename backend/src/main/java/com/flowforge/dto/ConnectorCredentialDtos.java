package com.flowforge.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public class ConnectorCredentialDtos {
    public record ConnectorCredentialResponse(Long id, String connectorSlug, String displayName, Instant createdAt) {}
    public record SaveConnectorCredentialRequest(@NotBlank String displayName, @NotBlank String secret) {}
    public record OAuthStartResponse(String authorizationUrl, String state) {}
}
