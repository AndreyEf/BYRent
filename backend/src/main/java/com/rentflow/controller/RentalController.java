package com.rentflow.controller;

import com.rentflow.dto.PropertyResponse;
import com.rentflow.dto.TenantHistoryResponse;
import com.rentflow.entity.Property;
import com.rentflow.entity.RentalRequest;
import com.rentflow.entity.TenantHistory;
import com.rentflow.security.CustomUserDetails;
import com.rentflow.service.PropertyService;
import com.rentflow.service.RentalRequestService;
import com.rentflow.service.TenantHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RentalController {
    private final PropertyService propertyService;
    private final RentalRequestService rentalRequestService;
    private final TenantHistoryService tenantHistoryService;

    @GetMapping("/rentals/current")
    public ResponseEntity<List<PropertyResponse>> getCurrentRentals(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<Property> properties = propertyService.getRentedProperties(userDetails.getUser().getId());
        return ResponseEntity.ok(properties.stream()
            .map(PropertyResponse::fromEntity)
            .collect(Collectors.toList()));
    }

    @GetMapping("/rentals/my")
    public ResponseEntity<List<Map<String, Object>>> getMyRentalRequests(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<RentalRequest> requests = rentalRequestService.getRequestsByRequester(userDetails.getUser().getId());
        
        List<Map<String, Object>> result = requests.stream()
            .map(request -> {
                Map<String, Object> item = new HashMap<>();
                item.put("property", PropertyResponse.fromEntity(request.getProperty()));
                item.put("request", Map.of(
                    "id", request.getId(),
                    "status", request.getStatus(),
                    "createdAt", request.getCreatedAt()
                ));
                return item;
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/landlord-history")
    public ResponseEntity<List<TenantHistoryResponse>> getLandlordHistory(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<TenantHistory> history = tenantHistoryService.getHistoryByTenant(userDetails.getUser().getId());
        return ResponseEntity.ok(history.stream()
            .map(TenantHistoryResponse::fromEntity)
            .collect(Collectors.toList()));
    }

    @PostMapping("/rentals/{propertyId}/leave")
    public ResponseEntity<?> leaveRental(
            @PathVariable String propertyId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Property property = propertyService.leaveRental(propertyId, userDetails.getUser().getId());
            return ResponseEntity.ok(PropertyResponse.fromEntity(property));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
