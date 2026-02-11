package com.rentflow.controller;

import com.rentflow.dto.ReviewRequest;
import com.rentflow.dto.ReviewResponse;
import com.rentflow.entity.Review;
import com.rentflow.security.CustomUserDetails;
import com.rentflow.service.ReviewService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Slf4j
public class ReviewController {
    private final ReviewService reviewService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsForUser(@PathVariable UUID userId) {
        List<Review> reviews = reviewService.getReviewsForUser(userId);
        return ResponseEntity.ok(reviews.stream()
            .map(ReviewResponse::fromEntity)
            .collect(Collectors.toList()));
    }

    @GetMapping("/by/{userId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsByUser(@PathVariable UUID userId) {
        List<Review> reviews = reviewService.getReviewsByUser(userId);
        return ResponseEntity.ok(reviews.stream()
            .map(ReviewResponse::fromEntity)
            .collect(Collectors.toList()));
    }

    @GetMapping("/property/{propertyId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsForProperty(@PathVariable Long propertyId) {
        List<Review> reviews = reviewService.getReviewsForProperty(propertyId);
        return ResponseEntity.ok(reviews.stream()
            .map(ReviewResponse::fromEntity)
            .collect(Collectors.toList()));
    }

    @GetMapping("/rating/{userId}")
    public ResponseEntity<?> getUserRating(@PathVariable UUID userId) {
        Double rating = reviewService.getAverageRating(userId);
        return ResponseEntity.ok(Map.of("rating", rating != null ? rating : 0));
    }

    @PostMapping
    public ResponseEntity<?> createReview(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ReviewRequest request) {
        try {
            Review review = reviewService.createReview(userDetails.user().getId(), request);
            return ResponseEntity.ok(ReviewResponse.fromEntity(review));
        } catch (RuntimeException e) {
            log.error("createReview failed", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReview(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            reviewService.deleteReview(id, userDetails.user().getId(),
                userDetails.user().getIsAdmin());
            return ResponseEntity.ok(Map.of("message", "Отзыв удалён"));
        } catch (RuntimeException e) {
            log.error("deleteReview failed: id={}", id, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
