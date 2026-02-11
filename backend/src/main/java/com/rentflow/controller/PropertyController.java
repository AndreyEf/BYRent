package com.rentflow.controller;

import com.rentflow.dto.*;
import com.rentflow.entity.Property;
import com.rentflow.entity.User;
import com.rentflow.security.CustomUserDetails;
import com.rentflow.service.PropertyService;
import com.rentflow.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
@Slf4j
public class PropertyController {
    private final PropertyService propertyService;
    private final UserService userService;

    @GetMapping("/my")
    public ResponseEntity<List<PropertyResponse>> getMyProperties(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<Property> properties = propertyService.getPropertiesByOwner(userDetails.user().getId());
        return ResponseEntity.ok(properties.stream()
            .map(PropertyResponse::fromEntity)
            .collect(Collectors.toList()));
    }

    @GetMapping("/rented")
    public ResponseEntity<List<PropertyResponse>> getRentedProperties(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<Property> properties = propertyService.getRentedProperties(userDetails.user().getId());
        return ResponseEntity.ok(properties.stream()
            .map(PropertyResponse::fromEntity)
            .collect(Collectors.toList()));
    }

    @GetMapping("/available")
    public ResponseEntity<List<PropertyResponse>> getAvailableProperties(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<Property> properties = propertyService.getAvailableProperties(userDetails.user().getId());
        return ResponseEntity.ok(properties.stream()
            .map(PropertyResponse::fromEntity)
            .collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProperty(@PathVariable Long id) {
        try {
            Property property = propertyService.getPropertyById(id);
            return ResponseEntity.ok(PropertyResponse.fromEntity(property));
        } catch (RuntimeException e) {
            log.error("getProperty failed: id={}", id, e);
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchProperty(
            @RequestParam(required = false) String cadastralNumber,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String ownerPhone,
            @RequestParam(required = false) String ownerEmail) {
        
        // Search by cadastral number (returns single property)
        if (cadastralNumber != null && !cadastralNumber.trim().isEmpty()) {
            try {
                Property property = propertyService.getPropertyByCadastralNumber(cadastralNumber.trim());
                return ResponseEntity.ok(PropertyResponse.fromEntity(property));
            } catch (RuntimeException e) {
                log.error("searchProperty by cadastralNumber failed: cadastralNumber={}", cadastralNumber.trim(), e);
                return ResponseEntity.notFound().build();
            }
        }
        
        // Search by address (returns list)
        if (address != null && !address.trim().isEmpty()) {
            List<Property> properties = propertyService.searchPropertiesByAddress(address.trim());
            if (properties.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(properties.stream()
                .map(PropertyResponse::fromEntity)
                .collect(Collectors.toList()));
        }
        
        // Search by owner phone (returns list)
        if (ownerPhone != null && !ownerPhone.trim().isEmpty()) {
            List<Property> properties = propertyService.getPropertiesByOwnerPhone(ownerPhone.trim());
            if (properties.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(properties.stream()
                .map(PropertyResponse::fromEntity)
                .collect(Collectors.toList()));
        }
        
        // Search by owner email (returns list)
        if (ownerEmail != null && !ownerEmail.trim().isEmpty()) {
            List<Property> properties = propertyService.getPropertiesByOwnerEmail(ownerEmail.trim());
            if (properties.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(properties.stream()
                .map(PropertyResponse::fromEntity)
                .collect(Collectors.toList()));
        }
        
        return ResponseEntity.badRequest().body(Map.of("message", "Укажите параметр поиска: address, ownerPhone или ownerEmail"));
    }

    @PostMapping
    public ResponseEntity<?> createProperty(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody PropertyRequest request) {
        try {
            User freshUser = userService.findById(userDetails.user().getId())
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
            
            if (!Boolean.TRUE.equals(freshUser.getPhoneVerified())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "message", "Для добавления недвижимости необходимо подтвердить номер телефона",
                    "requiresPhoneVerification", true
                ));
            }
            Property property = propertyService.createProperty(freshUser.getId(), request);
            return ResponseEntity.ok(PropertyResponse.fromEntity(property));
        } catch (RuntimeException e) {
            log.error("createProperty failed", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateProperty(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody PropertyRequest request) {
        try {
            Property property = propertyService.updateProperty(id, userDetails.user().getId(), request);
            return ResponseEntity.ok(PropertyResponse.fromEntity(property));
        } catch (RuntimeException e) {
            log.error("updateProperty failed: id={}", id, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProperty(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            propertyService.deleteProperty(id, userDetails.user().getId());
            return ResponseEntity.ok(Map.of("message", "Объект удалён"));
        } catch (RuntimeException e) {
            log.error("deleteProperty failed: id={}", id, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/remove-tenant")
    public ResponseEntity<?> removeTenant(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Property property = propertyService.removeTenant(id, userDetails.user().getId());
            return ResponseEntity.ok(PropertyResponse.fromEntity(property));
        } catch (RuntimeException e) {
            log.error("removeTenant failed: id={}", id, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/map")
    public ResponseEntity<List<PropertyResponse>> getPropertiesForMap() {
        List<Property> properties = propertyService.getAllAvailableProperties();
        return ResponseEntity.ok(properties.stream()
            .map(PropertyResponse::fromEntity)
            .collect(Collectors.toList()));
    }

    @GetMapping("/cities")
    public ResponseEntity<List<String>> getAvailableCities() {
        return ResponseEntity.ok(propertyService.getAvailableCities());
    }

    @PostMapping("/{id}/visibility")
    public ResponseEntity<?> updateVisibility(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, Boolean> body) {
        try {
            Boolean isVisible = body.get("isVisible");
            if (isVisible == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "isVisible обязателен"));
            }
            Property property = propertyService.updateVisibility(id, userDetails.user().getId(), isVisible);
            return ResponseEntity.ok(PropertyResponse.fromEntity(property));
        } catch (RuntimeException e) {
            log.error("updateVisibility failed: id={}", id, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/active")
    public ResponseEntity<?> updateActiveStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, Boolean> body) {
        try {
            Boolean isActive = body.get("isActive");
            if (isActive == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "isActive обязателен"));
            }
            Property property = propertyService.updateActiveStatus(id, userDetails.user().getId(), isActive);
            return ResponseEntity.ok(PropertyResponse.fromEntity(property));
        } catch (RuntimeException e) {
            log.error("updateActiveStatus failed: id={}", id, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
