package com.rentflow.repository;

import com.rentflow.entity.TenantHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TenantHistoryRepository extends JpaRepository<TenantHistory, String> {
    List<TenantHistory> findByPropertyIdOrderByStartDateDesc(String propertyId);
    List<TenantHistory> findByTenantIdOrderByStartDateDesc(String tenantId);
    TenantHistory findByPropertyIdAndEndDateIsNull(String propertyId);
}
