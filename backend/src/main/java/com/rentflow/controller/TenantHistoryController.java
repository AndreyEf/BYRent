package com.rentflow.controller;

import com.rentflow.dto.TenantHistoryResponse;
import com.rentflow.entity.TenantHistory;
import com.rentflow.service.TenantHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tenant-history")
@RequiredArgsConstructor
public class TenantHistoryController {
    private final TenantHistoryService tenantHistoryService;

    @GetMapping("/property/{propertyId}")
    public ResponseEntity<List<TenantHistoryResponse>> getPropertyHistory(@PathVariable String propertyId) {
        List<TenantHistory> history = tenantHistoryService.getHistoryByProperty(propertyId);
        return ResponseEntity.ok(history.stream()
            .map(TenantHistoryResponse::fromEntity)
            .collect(Collectors.toList()));
    }

    @GetMapping("/tenant/{tenantId}")
    public ResponseEntity<List<TenantHistoryResponse>> getTenantHistory(@PathVariable String tenantId) {
        List<TenantHistory> history = tenantHistoryService.getHistoryByTenant(tenantId);
        return ResponseEntity.ok(history.stream()
            .map(TenantHistoryResponse::fromEntity)
            .collect(Collectors.toList()));
    }
}
