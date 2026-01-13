package com.rentflow.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "subscription_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubscriptionPlan {
    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private Integer price;

    @Column(name = "property_limit", nullable = false)
    private Integer propertyLimit;

    private String description;

    @JsonIgnore
    @OneToMany(mappedBy = "plan")
    private List<UserSubscription> subscriptions;
}
