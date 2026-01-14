package com.rentflow.repository;

import com.rentflow.entity.RentalRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RentalRequestRepository extends JpaRepository<RentalRequest, String> {
    List<RentalRequest> findByRequesterId(String requesterId);
    List<RentalRequest> findByPropertyId(String propertyId);
    
    @Query("SELECT rr FROM RentalRequest rr WHERE rr.property.owner.id = :ownerId")
    List<RentalRequest> findByPropertyOwnerId(@Param("ownerId") String ownerId);
    
    @Query("SELECT rr FROM RentalRequest rr WHERE rr.property.id = :propertyId AND rr.requester.id = :requesterId AND rr.status = 'pending'")
    Optional<RentalRequest> findPendingByPropertyAndRequester(@Param("propertyId") String propertyId, @Param("requesterId") String requesterId);
    
    boolean existsByPropertyIdAndRequesterIdAndStatus(String propertyId, String requesterId, String status);
}
