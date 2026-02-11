package com.rentflow.repository;

import com.rentflow.entity.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long> {
    List<Property> findByOwnerId(UUID ownerId);
    
    @Query("SELECT p FROM Property p WHERE p.currentTenant.id = :tenantId")
    List<Property> findByCurrentTenantId(@Param("tenantId") UUID tenantId);
    
    @Query("SELECT p FROM Property p WHERE p.currentTenant IS NULL AND p.owner.id != :userId AND p.isVisible = true AND p.isActive = true")
    List<Property> findAvailablePropertiesExcludingOwner(@Param("userId") UUID userId);
    
    @Query("SELECT p FROM Property p WHERE p.currentTenant IS NULL AND p.isVisible = true AND p.isActive = true")
    List<Property> findAllAvailableProperties();
    
    List<Property> findByCurrentTenantIdIsNull();
    
    List<Property> findByCity(String city);
    
    @Query("SELECT DISTINCT p.city FROM Property p WHERE p.currentTenant IS NULL AND p.isVisible = true AND p.isActive = true")
    List<String> findDistinctCitiesWithAvailableProperties();
    
    long countByOwnerId(UUID ownerId);
    
    @Query("SELECT COUNT(p) FROM Property p WHERE p.owner.id = :ownerId AND p.isActive = true")
    long countActiveByOwnerId(@Param("ownerId") UUID ownerId);
    
    @Query("SELECT p FROM Property p WHERE p.cadastralNumber = :cadastralNumber")
    java.util.Optional<Property> findByCadastralNumber(@Param("cadastralNumber") String cadastralNumber);
    
    @Query("SELECT p FROM Property p WHERE LOWER(p.city) LIKE LOWER(CONCAT('%', :address, '%')) OR LOWER(p.street) LIKE LOWER(CONCAT('%', :address, '%')) OR LOWER(CONCAT(p.city, ' ', p.street, ' ', p.building)) LIKE LOWER(CONCAT('%', :address, '%'))")
    List<Property> searchByAddress(@Param("address") String address);
    
    @Query("SELECT p FROM Property p WHERE p.owner.phone = :phone")
    List<Property> findByOwnerPhone(@Param("phone") String phone);
    
    @Query("SELECT p FROM Property p WHERE LOWER(p.owner.email) = LOWER(:email)")
    List<Property> findByOwnerEmail(@Param("email") String email);
}
