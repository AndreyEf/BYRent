package com.rentflow.repository;

import com.rentflow.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, String> {
    List<Review> findByRevieweeIdOrderByCreatedAtDesc(UUID revieweeId);
    List<Review> findByReviewerIdOrderByCreatedAtDesc(UUID reviewerId);
    
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.reviewee.id = :userId")
    Double getAverageRatingForUser(@Param("userId") UUID userId);
    
    long countByRevieweeId(UUID revieweeId);
    
    boolean existsByReviewerIdAndRevieweeIdAndPropertyId(UUID reviewerId, UUID revieweeId, Long propertyId);
    
    List<Review> findByPropertyIdOrderByCreatedAtDesc(Long propertyId);
    
    List<Review> findByPropertyIdAndReviewTypeOrderByCreatedAtDesc(Long propertyId, String reviewType);
}
