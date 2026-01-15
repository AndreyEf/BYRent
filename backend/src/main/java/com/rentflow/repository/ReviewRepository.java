package com.rentflow.repository;

import com.rentflow.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, String> {
    List<Review> findByRevieweeIdOrderByCreatedAtDesc(String revieweeId);
    List<Review> findByReviewerIdOrderByCreatedAtDesc(String reviewerId);
    
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.reviewee.id = :userId")
    Double getAverageRatingForUser(@Param("userId") String userId);
    
    long countByRevieweeId(String revieweeId);
    
    boolean existsByReviewerIdAndRevieweeIdAndPropertyId(String reviewerId, String revieweeId, String propertyId);
    
    List<Review> findByPropertyIdOrderByCreatedAtDesc(String propertyId);
}
