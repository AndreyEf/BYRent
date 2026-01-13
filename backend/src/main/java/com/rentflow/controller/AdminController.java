package com.rentflow.controller;

import com.rentflow.dto.*;
import com.rentflow.entity.*;
import com.rentflow.repository.*;
import com.rentflow.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
}
