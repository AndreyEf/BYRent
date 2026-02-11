package com.rentflow.repository;

import com.rentflow.entity.TenantHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface TenantHistoryRepository extends JpaRepository<TenantHistory, Long> {
    List<TenantHistory> findByPropertyIdOrderByStartDateDesc(Long propertyId);
    List<TenantHistory> findByTenantIdOrderByStartDateDesc(UUID tenantId);
    TenantHistory findByPropertyIdAndEndDateIsNull(Long propertyId);
}
