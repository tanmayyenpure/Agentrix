package com.flowforge.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class WorkflowRequest {

    @NotBlank
    private String name;

    private String description;

    private boolean active = true;

    @Valid
    private List<NodeDto> nodes = new ArrayList<>();

    @Valid
    private List<EdgeDto> edges = new ArrayList<>();
}
