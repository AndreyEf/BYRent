package com.rentflow.dto;

import com.rentflow.entity.SubscriptionPlan;
import com.rentflow.entity.UserSubscription;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class SubscriptionResponse {
    private String id;
    private String userId;
    private String planId;
    private String status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime createdAt;
    private SubscriptionPlanResponse plan;

    public static SubscriptionResponse fromEntity(UserSubscription subscription) {
        return SubscriptionResponse.builder()
            .id(subscription.getId())
            .userId(subscription.getUser().getId())
            .planId(subscription.getPlan().getId())
            .status(subscription.getStatus())
            .startDate(subscription.getStartDate())
            .endDate(subscription.getEndDate())
            .createdAt(subscription.getCreatedAt())
            .plan(SubscriptionPlanResponse.fromEntity(subscription.getPlan()))
            .build();
    }
}

@Data
@Builder
class SubscriptionPlanResponse {
    private String id;
    private String name;
    private Integer price;
    private Integer propertyLimit;
    private String description;

    public static SubscriptionPlanResponse fromEntity(SubscriptionPlan plan) {
        return SubscriptionPlanResponse.builder()
            .id(plan.getId())
            .name(plan.getName())
            .price(plan.getPrice())
            .propertyLimit(plan.getPropertyLimit())
            .description(plan.getDescription())
            .build();
    }
}
