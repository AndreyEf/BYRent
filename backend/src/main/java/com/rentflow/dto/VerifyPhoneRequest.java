package com.rentflow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyPhoneRequest {
    @NotBlank(message = "Phone number is required")
    private String phone;
}
