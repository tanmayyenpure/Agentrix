package com.flowforge.dto;

import jakarta.validation.constraints.NotBlank;

public class BillingDtos {
    public record BillingPlanResponse(Long id, String code, String name, int monthlyPriceCents, int workflowLimit, int executionLimit) {}
    public record SubscriptionResponse(Long id, String status, BillingPlanResponse plan) {}
    public record ChangePlanRequest(@NotBlank String planCode) {}
}
