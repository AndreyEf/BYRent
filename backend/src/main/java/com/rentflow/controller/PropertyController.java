package com.rentflow.controller;

import com.rentflow.dto.*;
import com.rentflow.entity.Property;
import com.rentflow.entity.User;
import com.rentflow.security.CustomUserDetails;
import com.rentflow.service.PropertyService;
import com.rentflow.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
public class PropertyController {
    private final PropertyService propertyService;
    private final UserService userService;

    @GetMapping("/my")
    public ResponseEntity<List<PropertyResponse>> getMyProperties(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<Property> properties = propertyService.getPropertiesByOwner(userDetails.getUser().getId());
        return ResponseEntity.ok(properties.stream()
            .map(PropertyResponse::fromEntity)
            .collect(Collectors.toList()));
    }

    @GetMapping("/rented")
    public ResponseEntity<List<PropertyResponse>> getRentedProperties(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<Property> properties = propertyService.getRentedProperties(userDetails.getUser().getId());
        return ResponseEntity.ok(properties.stream()
            .map(PropertyResponse::fromEntity)
            .collect(Collectors.toList()));
    }

    @GetMapping("/available")
    public ResponseEntity<List<PropertyResponse>> getAvailableProperties(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<Property> properties = propertyService.getAvailableProperties(userDetails.getUser().getId());
        return ResponseEntity.ok(properties.stream()
            .map(PropertyResponse::fromEntity)
            .collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProperty(@PathVariable String id) {
        try {
            Property property = propertyService.getPropertyById(id);
            return ResponseEntity.ok(PropertyResponse.fromEntity(property));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createProperty(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody PropertyRequest request) {
        try {
            User freshUser = userService.findById(userDetails.getUser().getId())
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
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateProperty(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody PropertyRequest request) {
        try {
            Property property = propertyService.updateProperty(id, userDetails.getUser().getId(), request);
            return ResponseEntity.ok(PropertyResponse.fromEntity(property));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProperty(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            propertyService.deleteProperty(id, userDetails.getUser().getId());
            return ResponseEntity.ok(Map.of("message", "Объект удалён"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/remove-tenant")
    public ResponseEntity<?> removeTenant(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            Property property = propertyService.removeTenant(id, userDetails.getUser().getId());
            return ResponseEntity.ok(PropertyResponse.fromEntity(property));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
