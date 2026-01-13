package com.rentflow.repository;

import com.rentflow.entity.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PropertyRepository extends JpaRepository<Property, String> {
    List<Property> findByOwnerId(String ownerId);
    
    @Query("SELECT p FROM Property p WHERE p.currentTenant.id = :tenantId")
    List<Property> findByCurrentTenantId(@Param("tenantId") String tenantId);
    
    @Query("SELECT p FROM Property p WHERE p.currentTenant IS NULL AND p.owner.id != :userId")
    List<Property> findAvailablePropertiesExcludingOwner(@Param("userId") String userId);
    
    long countByOwnerId(String ownerId);
}
