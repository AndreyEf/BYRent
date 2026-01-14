package com.rentflow.dto;

import com.rentflow.entity.Review;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ReviewResponse {
    private String id;
    private String reviewerId;
    private String revieweeId;
    private String propertyId;
    private Integer rating;
    private String comment;
    private String reviewType;
    private LocalDateTime createdAt;
    private UserResponse reviewer;
    private UserResponse reviewee;
    private PropertyResponse property;

    public static ReviewResponse fromEntity(Review review) {
        ReviewResponseBuilder builder = ReviewResponse.builder()
            .id(review.getId())
            .reviewerId(review.getReviewer().getId())
            .revieweeId(review.getReviewee().getId())
            .propertyId(review.getProperty() != null ? review.getProperty().getId() : null)
            .rating(review.getRating())
            .comment(review.getComment())
            .reviewType(review.getReviewType())
            .createdAt(review.getCreatedAt())
            .reviewer(UserResponse.fromEntity(review.getReviewer()))
            .reviewee(UserResponse.fromEntity(review.getReviewee()));

        if (review.getProperty() != null) {
            builder.property(PropertyResponse.fromEntity(review.getProperty()));
        }

        return builder.build();
    }
}
