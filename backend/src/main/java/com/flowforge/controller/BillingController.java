package com.flowforge.controller;

import com.flowforge.dto.BillingDtos.*;
import com.flowforge.security.CustomUserDetails;
import com.flowforge.service.BillingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {
    private final BillingService billingService;

    @GetMapping("/plans")
    public List<BillingPlanResponse> plans() {
        return billingService.plans();
    }

    @GetMapping("/subscription")
    public SubscriptionResponse current(@AuthenticationPrincipal CustomUserDetails principal) {
        return billingService.current(principal.getUser());
    }

    @PutMapping("/subscription")
    public SubscriptionResponse changePlan(@Valid @RequestBody ChangePlanRequest request, @AuthenticationPrincipal CustomUserDetails principal) {
        return billingService.changePlan(request, principal.getUser());
    }
}
