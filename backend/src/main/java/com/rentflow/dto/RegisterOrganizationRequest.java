package com.rentflow.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterOrganizationRequest {
    @NotBlank(message = "Введите email")
    @Email(message = "Введите корректный email")
    private String email;

    @NotBlank(message = "Введите пароль")
    @Size(min = 6, message = "Пароль должен быть не менее 6 символов")
    private String password;

    @NotBlank(message = "Введите наименование организации")
    private String organizationName;

    @NotBlank(message = "Введите УНП")
    @Size(min = 9, max = 9, message = "УНП должен содержать 9 цифр")
    @Pattern(regexp = "^[0-9]{9}$", message = "УНП должен состоять только из цифр")
    private String unp;

    @NotBlank(message = "Введите номер телефона")
    @Pattern(regexp = "^\\+?[0-9\\s\\-\\(\\)]{7,20}$", message = "Введите корректный номер телефона")
    private String phone;
}
