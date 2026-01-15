package com.rentflow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginPhoneRequest {
    @NotBlank(message = "Телефон обязателен")
    private String phone;

    @NotBlank(message = "Пароль обязателен")
    private String password;
}
