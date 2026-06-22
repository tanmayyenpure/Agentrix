package com.flowforge.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "flowforge")
public class FlowForgeProperties {
    private Ai ai = new Ai();
    private Security security = new Security();
    private App app = new App();

    @Data
    public static class Ai {
        private String provider = "local";
        private String model = "gpt-4.1-mini";
        private String openaiApiKey = "";
        private String anthropicApiKey = "";
    }

    @Data
    public static class Security {
        private String allowedOrigins = "*";
        private int rateLimitPerMinute = 120;
    }

    @Data
    public static class App {
        private String frontendUrl = "http://localhost:5173";
    }
}
