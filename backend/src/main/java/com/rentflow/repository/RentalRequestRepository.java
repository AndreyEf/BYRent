package com.rentflow.repository;

import com.rentflow.entity.RentalRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RentalRequestRepository extends JpaRepository<RentalRequest, Long> {
    List<RentalRequest> findByRequesterId(UUID requesterId);
    List<RentalRequest> findByPropertyId(Long propertyId);
    
    @Query("SELECT rr FROM RentalRequest rr WHERE rr.property.owner.id = :ownerId")
    List<RentalRequest> findByPropertyOwnerId(@Param("ownerId") UUID ownerId);
    
    @Query("SELECT rr FROM RentalRequest rr WHERE rr.property.id = :propertyId AND rr.requester.id = :requesterId AND rr.status = 'pending'")
    Optional<RentalRequest> findPendingByPropertyAndRequester(@Param("propertyId") Long propertyId, @Param("requesterId") UUID requesterId);
    
    boolean existsByPropertyIdAndRequesterIdAndStatus(Long propertyId, UUID requesterId, String status);
}
