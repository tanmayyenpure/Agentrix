package com.flowforge.repository;

import com.flowforge.model.Execution;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExecutionRepository extends JpaRepository<Execution, Long> {
    List<Execution> findByWorkflowIdOrderByStartedAtDesc(Long workflowId);
}
