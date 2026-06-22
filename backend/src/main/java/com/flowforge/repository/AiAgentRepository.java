package com.flowforge.repository;

import com.flowforge.model.AiAgent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AiAgentRepository extends JpaRepository<AiAgent, Long> {
    List<AiAgent> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);
}
