package com.flowforge.service;

import com.flowforge.dto.ConnectorCredentialDtos.*;
import com.flowforge.model.ConnectorCredential;
import com.flowforge.model.User;
import com.flowforge.repository.ConnectorCredentialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConnectorCredentialService {
    private final ConnectorCredentialRepository credentialRepository;
    private final PermissionService permissionService;

    public List<ConnectorCredentialResponse> list(String slug, User user) {
        return credentialRepository.findByOrganizationIdAndConnectorSlugOrderByCreatedAtDesc(user.getOrganization().getId(), slug).stream().map(this::response).toList();
    }

    @Transactional
    public ConnectorCredentialResponse save(String slug, SaveConnectorCredentialRequest request, User user) {
        permissionService.require(user, "connector:install");
        ConnectorCredential credential = ConnectorCredential.builder()
                .organization(user.getOrganization())
                .connectorSlug(slug)
                .displayName(request.displayName())
                .encryptedSecret(Base64.getEncoder().encodeToString(request.secret().getBytes(StandardCharsets.UTF_8)))
                .build();
        return response(credentialRepository.save(credential));
    }

    public OAuthStartResponse startOAuth(String slug, User user) {
        permissionService.require(user, "connector:install");
        String state = UUID.randomUUID().toString().replace("-", "");
        return new OAuthStartResponse("https://auth.example.com/oauth/authorize?connector=" + slug + "&state=" + state, state);
    }

    private ConnectorCredentialResponse response(ConnectorCredential credential) {
        return new ConnectorCredentialResponse(credential.getId(), credential.getConnectorSlug(), credential.getDisplayName(), credential.getCreatedAt());
    }
}
