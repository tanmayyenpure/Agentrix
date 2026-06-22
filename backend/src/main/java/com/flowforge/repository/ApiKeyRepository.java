package com.flowforge.repository;

import com.flowforge.model.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApiKeyRepository extends JpaRepository<ApiKey, Long> {
    List<ApiKey> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);
    Optional<ApiKey> findByKeyHash(String keyHash);
}
