package com.rentflow.dto;

import com.rentflow.entity.TenantHistory;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class TenantHistoryResponse {
    private String id;
    private String propertyId;
    private String tenantId;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime createdAt;
    private UserResponse tenant;
    private PropertyResponse property;

    public static TenantHistoryResponse fromEntity(TenantHistory history) {
        return TenantHistoryResponse.builder()
            .id(history.getId())
            .propertyId(history.getProperty().getId())
            .tenantId(history.getTenant().getId())
            .startDate(history.getStartDate())
            .endDate(history.getEndDate())
            .createdAt(history.getCreatedAt())
            .tenant(UserResponse.fromEntity(history.getTenant()))
            .property(PropertyResponse.fromEntity(history.getProperty()))
            .build();
    }
}
