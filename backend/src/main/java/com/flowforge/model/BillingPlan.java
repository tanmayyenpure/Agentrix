package com.flowforge.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "billing_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BillingPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true)
    private String code;
    @Column(nullable = false)
    private String name;
    @Column(nullable = false)
    private int monthlyPriceCents;
    @Column(nullable = false)
    private int workflowLimit;
    @Column(nullable = false)
    private int executionLimit;
}
