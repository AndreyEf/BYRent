package com.rentflow.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "Введите email")
    @Email(message = "Введите корректный email")
    private String email;

    @NotBlank(message = "Введите пароль")
    private String password;
}
