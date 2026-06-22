package com.flowforge.repository;

import com.flowforge.model.Workflow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkflowRepository extends JpaRepository<Workflow, Long> {
    List<Workflow> findByOwnerId(Long ownerId);
    List<Workflow> findByOrganizationId(Long organizationId);
}
