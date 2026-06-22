package com.flowforge.config;

import com.flowforge.model.BillingPlan;
import com.flowforge.model.IntegrationConnector;
import com.flowforge.model.Role;
import com.flowforge.model.enums.RoleName;
import com.flowforge.repository.BillingPlanRepository;
import com.flowforge.repository.IntegrationConnectorRepository;
import com.flowforge.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/** Ensures the fixed set of roles exists on startup. */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final IntegrationConnectorRepository connectorRepository;
    private final BillingPlanRepository billingPlanRepository;

    @Override
    public void run(String... args) {
        for (RoleName roleName : RoleName.values()) {
            roleRepository.findByName(roleName)
                    .orElseGet(() -> roleRepository.save(Role.builder().name(roleName).build()));
        }
        seedConnector("slack-alert", "Slack Alert", "Messaging", "Send workflow results to a Slack-compatible webhook.", "Webhook", slackTemplate());
        seedConnector("crm-lead-routing", "CRM Lead Routing", "Sales", "Receive a lead and post it into a CRM enrichment endpoint.", "API Key", crmTemplate());
        seedConnector("daily-report", "Daily Report", "Operations", "Run every morning, call a reporting API, and log the result.", "Bearer Token", reportTemplate());
        seedPlan("free", "Free", 0, 5, 1000);
        seedPlan("team", "Team", 4900, 100, 50000);
        seedPlan("enterprise", "Enterprise", 19900, 1000, 1000000);
    }

    private void seedConnector(String slug, String name, String category, String description, String authType, String templateJson) {
        if (connectorRepository.existsBySlug(slug)) return;
        connectorRepository.save(IntegrationConnector.builder()
                .slug(slug)
                .name(name)
                .category(category)
                .description(description)
                .authType(authType)
                .templateJson(templateJson)
                .build());
    }

    private void seedPlan(String code, String name, int monthlyPriceCents, int workflowLimit, int executionLimit) {
        if (billingPlanRepository.existsByCode(code)) return;
        billingPlanRepository.save(BillingPlan.builder()
                .code(code)
                .name(name)
                .monthlyPriceCents(monthlyPriceCents)
                .workflowLimit(workflowLimit)
                .executionLimit(executionLimit)
                .build());
    }

    private String slackTemplate() {
        return """
                {"name":"Slack Alert Workflow","description":"Marketplace template for Slack-style alerts","active":true,"nodes":[{"clientId":"trigger","type":"TRIGGER_WEBHOOK","label":"Webhook trigger","positionX":80,"positionY":120},{"clientId":"slack","type":"HTTP_REQUEST","label":"Post alert","config":"{\\"url\\":\\"https://hooks.slack.com/services/example\\",\\"method\\":\\"POST\\"}","positionX":360,"positionY":120},{"clientId":"log","type":"LOG","label":"Record result","config":"{\\"message\\":\\"Slack alert sent\\"}","positionX":640,"positionY":120}],"edges":[{"sourceClientId":"trigger","targetClientId":"slack"},{"sourceClientId":"slack","targetClientId":"log"}]}
                """;
    }

    private String crmTemplate() {
        return """
                {"name":"CRM Lead Routing","description":"Marketplace template for lead intake","active":true,"nodes":[{"clientId":"trigger","type":"TRIGGER_WEBHOOK","label":"Lead received","positionX":80,"positionY":120},{"clientId":"crm","type":"HTTP_REQUEST","label":"Create CRM lead","config":"{\\"url\\":\\"https://api.example-crm.com/leads\\",\\"method\\":\\"POST\\"}","positionX":360,"positionY":120},{"clientId":"log","type":"LOG","label":"Record routing","config":"{\\"message\\":\\"Lead routed\\"}","positionX":640,"positionY":120}],"edges":[{"sourceClientId":"trigger","targetClientId":"crm"},{"sourceClientId":"crm","targetClientId":"log"}]}
                """;
    }

    private String reportTemplate() {
        return """
                {"name":"Daily Report","description":"Marketplace template for scheduled reporting","active":true,"nodes":[{"clientId":"trigger","type":"TRIGGER_SCHEDULE","label":"Daily schedule","config":"0 9 * * *","positionX":80,"positionY":120},{"clientId":"report","type":"HTTP_REQUEST","label":"Fetch report","config":"{\\"url\\":\\"https://api.example.com/report\\",\\"method\\":\\"GET\\"}","positionX":360,"positionY":120},{"clientId":"log","type":"LOG","label":"Store summary","config":"{\\"message\\":\\"Report fetched\\"}","positionX":640,"positionY":120}],"edges":[{"sourceClientId":"trigger","targetClientId":"report"},{"sourceClientId":"report","targetClientId":"log"}]}
                """;
    }
}
