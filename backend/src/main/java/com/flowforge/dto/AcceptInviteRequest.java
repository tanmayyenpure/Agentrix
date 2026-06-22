package com.flowforge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AcceptInviteRequest {
    @NotBlank
    private String token;

    @NotBlank
    private String fullName;

    @NotBlank
    @Size(min = 6)
    private String password;
}
