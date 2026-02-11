package com.rentflow.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EmailTemplateRequest {
    @NotBlank(message = "Код шаблона обязателен")
    private String code;

    @NotBlank(message = "Название шаблона обязательно")
    private String name;

    @NotBlank(message = "Тема письма обязательна")
    private String subject;

    @NotBlank(message = "Текст письма обязателен")
    private String body;

    private String description;
    private Boolean isActive;
}
