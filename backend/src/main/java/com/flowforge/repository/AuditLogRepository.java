package com.flowforge.repository;

import com.flowforge.model.AuditLog;
import com.flowforge.model.enums.ResourceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId, Pageable pageable);
    Page<AuditLog> findByOrganizationIdAndResourceTypeAndCreatedAtBetweenOrderByCreatedAtDesc(Long organizationId, ResourceType resourceType, Instant from, Instant to, Pageable pageable);
    Page<AuditLog> findByOrganizationIdAndCreatedAtBetweenOrderByCreatedAtDesc(Long organizationId, Instant from, Instant to, Pageable pageable);
}
