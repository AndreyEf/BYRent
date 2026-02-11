package com.rentflow.controller;

import com.rentflow.dto.SubscriptionResponse;
import com.rentflow.entity.UserSubscription;
import com.rentflow.security.CustomUserDetails;
import com.rentflow.service.SubscriptionService;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
@Slf4j
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
        UUID userId = userDetails.user().getId();
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
        int limit = subscriptionService.getPropertyLimit(userDetails.user().getId());
        long count = subscriptionService.getPropertyCount(userDetails.user().getId());
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
                userDetails.user().getId(), planId);
            return ResponseEntity.ok(SubscriptionResponse.fromEntity(subscription));
        } catch (RuntimeException e) {
            log.error("activateSubscription failed", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/cancel")
    public ResponseEntity<?> cancelSubscription(@AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            UserSubscription subscription = subscriptionService.cancelSubscription(
                userDetails.user().getId());
            return ResponseEntity.ok(SubscriptionResponse.fromEntity(subscription));
        } catch (RuntimeException e) {
            log.error("cancelSubscription failed", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
