package com.flowforge.repository;

import com.flowforge.model.WorkflowVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkflowVersionRepository extends JpaRepository<WorkflowVersion, Long> {
    List<WorkflowVersion> findByWorkflowIdOrderByVersionDesc(Long workflowId);
    Optional<WorkflowVersion> findByWorkflowIdAndVersion(Long workflowId, int version);
    void deleteByWorkflowId(Long workflowId);
}
