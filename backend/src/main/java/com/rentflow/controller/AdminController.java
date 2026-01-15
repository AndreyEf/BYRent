package com.rentflow.controller;

import com.rentflow.dto.*;
import com.rentflow.entity.*;
import com.rentflow.repository.*;
import com.rentflow.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final RentalRequestRepository rentalRequestRepository;
    private final ReviewRepository reviewRepository;
    private final ReviewService reviewService;
    private final UserSubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(users.stream()
            .map(UserResponse::fromEntity)
            .collect(Collectors.toList()));
    }

    @GetMapping("/properties")
    public ResponseEntity<List<PropertyResponse>> getAllProperties() {
        List<Property> properties = propertyRepository.findAll();
        return ResponseEntity.ok(properties.stream()
            .map(PropertyResponse::fromEntity)
            .collect(Collectors.toList()));
    }

    @GetMapping("/rental-requests")
    public ResponseEntity<List<RentalRequestDto>> getAllRentalRequests() {
        List<RentalRequest> requests = rentalRequestRepository.findAll();
        return ResponseEntity.ok(requests.stream()
            .map(RentalRequestDto::fromEntity)
            .collect(Collectors.toList()));
    }

    @GetMapping("/reviews")
    public ResponseEntity<List<ReviewResponse>> getAllReviews() {
        List<Review> reviews = reviewRepository.findAll();
        return ResponseEntity.ok(reviews.stream()
            .map(ReviewResponse::fromEntity)
            .collect(Collectors.toList()));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        try {
            userRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Пользователь удалён"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/properties/{id}")
    public ResponseEntity<?> deleteProperty(@PathVariable String id) {
        try {
            propertyRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Объект удалён"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable String id) {
        try {
            reviewService.deleteReview(id, null, true);
            return ResponseEntity.ok(Map.of("message", "Отзыв удалён"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        long userCount = userRepository.count();
        long propertyCount = propertyRepository.count();
        long requestCount = rentalRequestRepository.count();
        long reviewCount = reviewRepository.count();

        return ResponseEntity.ok(Map.of(
            "users", userCount,
            "properties", propertyCount,
            "rentalRequests", requestCount,
            "reviews", reviewCount
        ));
    }

    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<?> resetPassword(@PathVariable String id, @RequestBody Map<String, String> body) {
        try {
            User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
            
            String newPassword = body.get("newPassword");
            if (newPassword == null || newPassword.length() < 6) {
                return ResponseEntity.badRequest().body(Map.of("message", "Пароль должен быть не менее 6 символов"));
            }
            
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Пароль успешно изменён"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/users/{id}/block")
    public ResponseEntity<?> blockUser(@PathVariable String id) {
        try {
            User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
            
            if (Boolean.TRUE.equals(user.getIsAdmin())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Нельзя заблокировать администратора"));
            }
            
            user.setIsBlocked(true);
            userRepository.save(user);
            return ResponseEntity.ok(UserResponse.fromEntity(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/users/{id}/unblock")
    public ResponseEntity<?> unblockUser(@PathVariable String id) {
        try {
            User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
            
            user.setIsBlocked(false);
            userRepository.save(user);
            return ResponseEntity.ok(UserResponse.fromEntity(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/users/{userId}/subscription/{planId}")
    public ResponseEntity<?> changeUserSubscription(@PathVariable String userId, @PathVariable String planId) {
        try {
            User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
            
            SubscriptionPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Тариф не найден"));
            
            UserSubscription subscription = subscriptionRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Подписка не найдена"));
            
            subscription.setPlan(plan);
            subscription.setStatus("active");
            subscriptionRepository.save(subscription);
            
            return ResponseEntity.ok(Map.of(
                "message", "Тариф изменён",
                "user", UserResponse.fromEntity(user),
                "plan", plan.getName()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody Map<String, Object> updates) {
        try {
            User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
            
            if (updates.containsKey("firstName")) {
                user.setFirstName((String) updates.get("firstName"));
            }
            if (updates.containsKey("lastName")) {
                user.setLastName((String) updates.get("lastName"));
            }
            if (updates.containsKey("phone")) {
                user.setPhone((String) updates.get("phone"));
            }
            if (updates.containsKey("email")) {
                user.setEmail((String) updates.get("email"));
            }
            
            userRepository.save(user);
            return ResponseEntity.ok(UserResponse.fromEntity(user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/properties/{id}")
    public ResponseEntity<?> updateProperty(@PathVariable String id, @RequestBody Map<String, Object> updates) {
        try {
            Property property = propertyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Объект не найден"));
            
            if (updates.containsKey("city")) {
                property.setCity((String) updates.get("city"));
            }
            if (updates.containsKey("street")) {
                property.setStreet((String) updates.get("street"));
            }
            if (updates.containsKey("building")) {
                property.setBuilding((String) updates.get("building"));
            }
            if (updates.containsKey("apartment")) {
                property.setApartment((String) updates.get("apartment"));
            }
            if (updates.containsKey("rentPrice")) {
                property.setRentPrice(((Number) updates.get("rentPrice")).intValue());
            }
            if (updates.containsKey("isVisible")) {
                property.setIsVisible((Boolean) updates.get("isVisible"));
            }
            if (updates.containsKey("isActive")) {
                property.setIsActive((Boolean) updates.get("isActive"));
            }
            
            propertyRepository.save(property);
            return ResponseEntity.ok(PropertyResponse.fromEntity(property));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
