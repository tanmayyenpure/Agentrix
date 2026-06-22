package com.flowforge.repository;

import com.flowforge.model.Webhook;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WebhookRepository extends JpaRepository<Webhook, Long> {
    List<Webhook> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);
    Optional<Webhook> findBySecret(String secret);
}
