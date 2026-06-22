package com.flowforge.dto;

import com.flowforge.model.enums.NodeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class NodeDto {

    @NotBlank
    private String clientId;

    @NotNull
    private NodeType type;

    @NotBlank
    private String label;

    /** JSON string, node-specific config (e.g. {"url": "...", "method": "GET"}). */
    private String config;

    private double positionX;
    private double positionY;
}
