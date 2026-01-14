package com.rentflow.controller;

import com.rentflow.dto.SubscriptionResponse;
import com.rentflow.entity.SubscriptionPlan;
import com.rentflow.entity.UserSubscription;
import com.rentflow.security.CustomUserDetails;
import com.rentflow.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {
    private final SubscriptionService subscriptionService;

    @GetMapping("/plans")
    public ResponseEntity<?> getAllPlans() {
        return ResponseEntity.ok(subscriptionService.getAllPlans());
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMySubscription(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Не авторизован"));
        }
        String userId = userDetails.getUser().getId();
        UserSubscription subscription = subscriptionService.getSubscription(userId);
        int limit = subscriptionService.getPropertyLimit(userId);
        long count = subscriptionService.getPropertyCount(userId);
        
        java.util.HashMap<String, Object> response = new java.util.HashMap<>();
        response.put("subscription", subscription != null ? SubscriptionResponse.fromEntity(subscription) : null);
        response.put("propertyCount", count);
        response.put("propertyLimit", limit);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/limits")
    public ResponseEntity<?> getMyLimits(@AuthenticationPrincipal CustomUserDetails userDetails) {
        int limit = subscriptionService.getPropertyLimit(userDetails.getUser().getId());
        long count = subscriptionService.getPropertyCount(userDetails.getUser().getId());
        return ResponseEntity.ok(Map.of(
            "limit", limit,
            "count", count,
            "remaining", limit == -1 ? -1 : limit - count
        ));
    }

    @PostMapping("/activate")
    public ResponseEntity<?> activateSubscription(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, String> body) {
        try {
            String planId = body.get("planId");
            UserSubscription subscription = subscriptionService.activateSubscription(
                userDetails.getUser().getId(), planId);
            return ResponseEntity.ok(SubscriptionResponse.fromEntity(subscription));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/cancel")
    public ResponseEntity<?> cancelSubscription(@AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            UserSubscription subscription = subscriptionService.cancelSubscription(
                userDetails.getUser().getId());
            return ResponseEntity.ok(SubscriptionResponse.fromEntity(subscription));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
