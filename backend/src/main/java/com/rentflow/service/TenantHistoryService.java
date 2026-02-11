package com.rentflow.service;

import com.rentflow.entity.TenantHistory;
import com.rentflow.repository.TenantHistoryRepository;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TenantHistoryService {
    private final TenantHistoryRepository tenantHistoryRepository;

    public List<TenantHistory> getHistoryByProperty(Long propertyId) {
        return tenantHistoryRepository.findByPropertyIdOrderByStartDateDesc(propertyId);
    }

    public List<TenantHistory> getHistoryByTenant(UUID tenantId) {
        return tenantHistoryRepository.findByTenantIdOrderByStartDateDesc(tenantId);
    }
}
