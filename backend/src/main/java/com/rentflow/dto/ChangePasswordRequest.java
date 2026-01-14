package com.rentflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordRequest {
    @NotBlank(message = "Введите текущий пароль")
    private String currentPassword;

    @NotBlank(message = "Введите новый пароль")
    @Size(min = 6, message = "Новый пароль должен быть не менее 6 символов")
    private String newPassword;
}
