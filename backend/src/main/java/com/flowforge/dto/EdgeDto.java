package com.flowforge.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EdgeDto {

    @NotBlank
    private String sourceClientId;

    @NotBlank
    private String targetClientId;

    private String conditionBranch;
}
