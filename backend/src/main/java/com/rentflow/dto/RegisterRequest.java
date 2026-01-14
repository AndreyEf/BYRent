package com.rentflow.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Введите email")
    @Email(message = "Введите корректный email")
    private String email;

    @NotBlank(message = "Введите пароль")
    @Size(min = 6, message = "Пароль должен быть не менее 6 символов")
    private String password;

    @NotBlank(message = "Введите имя")
    private String firstName;

    @NotBlank(message = "Введите фамилию")
    private String lastName;

    private String phone;
}
