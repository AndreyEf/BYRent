package com.rentflow.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.List;

@Data
public class PropertyRequest {
    @NotBlank(message = "Введите адрес")
    private String address;

    @NotBlank(message = "Введите ФИО собственника")
    private String ownerFullName;

    @NotBlank(message = "Введите кадастровый номер")
    private String cadastralNumber;

    private String description;
    private List<String> photos;
    private Integer rentPrice;
    private String utilityPayments;
    private String hoaFees;
    private String electricityCost;

    @Size(max = 4096, message = "Максимум 4096 символов")
    private String additionalInfo;

    private String contractFile;
}
