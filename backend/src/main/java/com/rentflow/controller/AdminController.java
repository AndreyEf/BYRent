package com.rentflow.controller;

import com.rentflow.dto.*;
import com.rentflow.entity.*;
import com.rentflow.repository.*;
import com.rentflow.service.EmailService;
import com.rentflow.service.ReviewService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final RentalRequestRepository rentalRequestRepository;
    private final ReviewRepository reviewRepository;
    private final ReviewService reviewService;
    private final EmailService emailService;
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
    public ResponseEntity<?> deleteUser(@PathVariable UUID id) {
        try {
            userRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Пользователь удалён"));
        } catch (Exception e) {
            log.error("deleteUser failed: id={}", id, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/properties/{id}")
    public ResponseEntity<?> deleteProperty(@PathVariable Long id) {
        try {
            propertyRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Объект удалён"));
        } catch (Exception e) {
            log.error("deleteProperty failed: id={}", id, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<?> deleteReview(@PathVariable String id) {
        try {
            reviewService.deleteReview(id, null, true);
            return ResponseEntity.ok(Map.of("message", "Отзыв удалён"));
        } catch (RuntimeException e) {
            log.error("deleteReview failed: id={}", id, e);
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
    public ResponseEntity<?> resetPassword(@PathVariable UUID id, @RequestBody Map<String, String> body) {
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
            log.error("resetPassword failed: id={}", id, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/users/{id}/block")
    public ResponseEntity<?> blockUser(@PathVariable UUID id) {
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
            log.error("blockUser failed: id={}", id, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/users/{id}/unblock")
    public ResponseEntity<?> unblockUser(@PathVariable UUID id) {
        try {
            User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
            
            user.setIsBlocked(false);
            userRepository.save(user);
            return ResponseEntity.ok(UserResponse.fromEntity(user));
        } catch (Exception e) {
            log.error("unblockUser failed: id={}", id, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/users/{userId}/subscription/{planId}")
    public ResponseEntity<?> changeUserSubscription(@PathVariable UUID userId, @PathVariable String planId) {
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
            log.error("changeUserSubscription failed: userId={}, planId={}", userId, planId, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable UUID id, @RequestBody Map<String, Object> updates) {
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
            log.error("updateUser failed: id={}", id, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/properties/{id}")
    public ResponseEntity<?> updateProperty(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
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
            log.error("updateProperty failed: id={}", id, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/email-templates")
    public ResponseEntity<List<EmailTemplateResponse>> getEmailTemplates() {
        List<EmailTemplate> templates = emailService.getAllTemplates();
        return ResponseEntity.ok(templates.stream()
            .map(EmailTemplateResponse::fromEntity)
            .collect(Collectors.toList()));
    }

    @GetMapping("/email-templates/{id}")
    public ResponseEntity<?> getEmailTemplate(@PathVariable String id) {
        return emailService.getTemplateById(id)
            .map(t -> ResponseEntity.ok(EmailTemplateResponse.fromEntity(t)))
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/email-templates")
    public ResponseEntity<?> createEmailTemplate(@Valid @RequestBody EmailTemplateRequest request) {
        try {
            EmailTemplate template = EmailTemplate.builder()
                .code(request.getCode())
                .name(request.getName())
                .subject(request.getSubject())
                .body(request.getBody())
                .description(request.getDescription())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();
            EmailTemplate saved = emailService.saveTemplate(template);
            return ResponseEntity.ok(EmailTemplateResponse.fromEntity(saved));
        } catch (Exception e) {
            log.error("createEmailTemplate failed", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/email-templates/{id}")
    public ResponseEntity<?> updateEmailTemplate(@PathVariable String id, @RequestBody EmailTemplateRequest request) {
        try {
            EmailTemplate template = emailService.getTemplateById(id)
                .orElseThrow(() -> new RuntimeException("Шаблон не найден"));
            
            if (request.getCode() != null) {
                template.setCode(request.getCode());
            }
            if (request.getName() != null) {
                template.setName(request.getName());
            }
            if (request.getSubject() != null) {
                template.setSubject(request.getSubject());
            }
            if (request.getBody() != null) {
                template.setBody(request.getBody());
            }
            if (request.getDescription() != null) {
                template.setDescription(request.getDescription());
            }
            if (request.getIsActive() != null) {
                template.setIsActive(request.getIsActive());
            }
            
            EmailTemplate saved = emailService.saveTemplate(template);
            return ResponseEntity.ok(EmailTemplateResponse.fromEntity(saved));
        } catch (Exception e) {
            log.error("updateEmailTemplate failed: id={}", id, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/email-templates/{id}")
    public ResponseEntity<?> deleteEmailTemplate(@PathVariable String id) {
        try {
            emailService.deleteTemplate(id);
            return ResponseEntity.ok(Map.of("message", "Шаблон удалён"));
        } catch (Exception e) {
            log.error("deleteEmailTemplate failed: id={}", id, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
