package com.flowforge.service;

import com.flowforge.dto.BillingDtos.*;
import com.flowforge.exception.ResourceNotFoundException;
import com.flowforge.model.BillingPlan;
import com.flowforge.model.Subscription;
import com.flowforge.model.User;
import com.flowforge.repository.BillingPlanRepository;
import com.flowforge.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BillingService {
    private final BillingPlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PermissionService permissionService;

    public List<BillingPlanResponse> plans() {
        return planRepository.findAll().stream().map(this::planResponse).toList();
    }

    public SubscriptionResponse current(User user) {
        return subscriptionRepository.findByOrganizationId(user.getOrganization().getId()).map(this::subscriptionResponse).orElse(null);
    }

    @Transactional
    public SubscriptionResponse changePlan(ChangePlanRequest request, User user) {
        permissionService.require(user, "billing:manage");
        BillingPlan plan = planRepository.findByCode(request.planCode()).orElseThrow(() -> new ResourceNotFoundException("Plan not found: " + request.planCode()));
        Subscription subscription = subscriptionRepository.findByOrganizationId(user.getOrganization().getId()).orElseGet(() -> Subscription.builder().organization(user.getOrganization()).plan(plan).build());
        subscription.setPlan(plan);
        subscription.setStatus("ACTIVE");
        return subscriptionResponse(subscriptionRepository.save(subscription));
    }

    private SubscriptionResponse subscriptionResponse(Subscription subscription) {
        return new SubscriptionResponse(subscription.getId(), subscription.getStatus(), planResponse(subscription.getPlan()));
    }

    private BillingPlanResponse planResponse(BillingPlan plan) {
        return new BillingPlanResponse(plan.getId(), plan.getCode(), plan.getName(), plan.getMonthlyPriceCents(), plan.getWorkflowLimit(), plan.getExecutionLimit());
    }
}
