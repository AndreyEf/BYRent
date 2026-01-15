package com.rentflow.service;

import com.rentflow.dto.ReviewRequest;
import com.rentflow.entity.Property;
import com.rentflow.entity.Review;
import com.rentflow.entity.User;
import com.rentflow.repository.PropertyRepository;
import com.rentflow.repository.ReviewRepository;
import com.rentflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;

    public List<Review> getReviewsForUser(String userId) {
        return reviewRepository.findByRevieweeIdOrderByCreatedAtDesc(userId);
    }

    public List<Review> getReviewsByUser(String userId) {
        return reviewRepository.findByReviewerIdOrderByCreatedAtDesc(userId);
    }

    public List<Review> getReviewsForProperty(String propertyId) {
        return reviewRepository.findByPropertyIdOrderByCreatedAtDesc(propertyId);
    }

    public Double getAverageRating(String userId) {
        return reviewRepository.getAverageRatingForUser(userId);
    }

    @Transactional
    public Review createReview(String reviewerId, ReviewRequest request) {
        User reviewer = userRepository.findById(reviewerId)
            .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        User reviewee = userRepository.findById(request.getRevieweeId())
            .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        if (reviewerId.equals(request.getRevieweeId())) {
            throw new RuntimeException("Нельзя оставить отзыв самому себе");
        }

        Property property = null;
        if (request.getPropertyId() != null) {
            property = propertyRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Объект не найден"));

            // Check for duplicate review
            if (reviewRepository.existsByReviewerIdAndRevieweeIdAndPropertyId(
                    reviewerId, request.getRevieweeId(), request.getPropertyId())) {
                throw new RuntimeException("Вы уже оставили отзыв для этого пользователя по данному объекту");
            }
        }

        Review review = Review.builder()
            .id(UUID.randomUUID().toString())
            .reviewer(reviewer)
            .reviewee(reviewee)
            .property(property)
            .rating(request.getRating())
            .comment(request.getComment())
            .reviewType(request.getReviewType())
            .build();

        return reviewRepository.save(review);
    }

    @Transactional
    public void deleteReview(String reviewId, String userId, boolean isAdmin) {
        Review review = reviewRepository.findById(reviewId)
            .orElseThrow(() -> new RuntimeException("Отзыв не найден"));

        if (!isAdmin && !review.getReviewer().getId().equals(userId)) {
            throw new RuntimeException("Доступ запрещён");
        }

        reviewRepository.delete(review);
    }
}
