package com.flowforge.repository;

import com.flowforge.model.ConnectorCredential;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConnectorCredentialRepository extends JpaRepository<ConnectorCredential, Long> {
    List<ConnectorCredential> findByOrganizationIdAndConnectorSlugOrderByCreatedAtDesc(Long organizationId, String connectorSlug);
}
