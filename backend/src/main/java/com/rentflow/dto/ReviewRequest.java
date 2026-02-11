package com.rentflow.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import lombok.Data;

@Data
public class ReviewRequest {
    @NotNull(message = "Укажите ID пользователя")
    private UUID revieweeId;

    private Long propertyId;

    @NotNull(message = "Укажите оценку")
    @Min(value = 1, message = "Оценка от 1 до 5")
    @Max(value = 5, message = "Оценка от 1 до 5")
    private Integer rating;

    @Size(max = 2000, message = "Максимум 2000 символов")
    private String comment;

    @NotNull(message = "Укажите тип отзыва")
    private String reviewType;
}
