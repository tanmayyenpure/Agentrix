package com.flowforge.repository;

import com.flowforge.model.BillingPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BillingPlanRepository extends JpaRepository<BillingPlan, Long> {
    Optional<BillingPlan> findByCode(String code);
    boolean existsByCode(String code);
}
