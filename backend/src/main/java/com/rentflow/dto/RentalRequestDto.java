package com.rentflow.dto;

import com.rentflow.entity.RentalRequest;

import java.util.UUID;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class RentalRequestDto {
    private Long id;
    private Long propertyId;
    private UUID requesterId;
    private String status;
    private LocalDateTime createdAt;
    private PropertyResponse property;
    private UserResponse requester;

    public static RentalRequestDto fromEntity(RentalRequest request) {
        return RentalRequestDto.builder()
            .id(request.getId())
            .propertyId(request.getProperty().getId())
            .requesterId(request.getRequester().getId())
            .status(request.getStatus())
            .createdAt(request.getCreatedAt())
            .property(PropertyResponse.fromEntity(request.getProperty()))
            .requester(UserResponse.fromEntity(request.getRequester()))
            .build();
    }
}
