package com.rentflow.controller;

import com.rentflow.dto.RentalRequestDto;
import com.rentflow.entity.RentalRequest;
import com.rentflow.security.CustomUserDetails;
import com.rentflow.service.RentalRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rental-requests")
@RequiredArgsConstructor
public class RentalRequestController {
    private final RentalRequestService rentalRequestService;

    @GetMapping("/my")
    public ResponseEntity<List<RentalRequestDto>> getMyRequests(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<RentalRequest> requests = rentalRequestService.getRequestsByRequester(userDetails.getUser().getId());
        return ResponseEntity.ok(requests.stream()
            .map(RentalRequestDto::fromEntity)
            .collect(Collectors.toList()));
    }

    @GetMapping("/incoming")
    public ResponseEntity<List<RentalRequestDto>> getIncomingRequests(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<RentalRequest> requests = rentalRequestService.getRequestsByPropertyOwner(userDetails.getUser().getId());
        return ResponseEntity.ok(requests.stream()
            .map(RentalRequestDto::fromEntity)
            .collect(Collectors.toList()));
    }

    @GetMapping("/property/{propertyId}")
    public ResponseEntity<List<RentalRequestDto>> getPropertyRequests(@PathVariable String propertyId) {
        List<RentalRequest> requests = rentalRequestService.getRequestsByProperty(propertyId);
        return ResponseEntity.ok(requests.stream()
            .map(RentalRequestDto::fromEntity)
            .collect(Collectors.toList()));
    }

    @PostMapping
    public ResponseEntity<?> createRequest(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, String> body) {
        try {
            String propertyId = body.get("propertyId");
            RentalRequest request = rentalRequestService.createRequest(
                userDetails.getUser().getId(), propertyId);
            return ResponseEntity.ok(RentalRequestDto.fromEntity(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveRequest(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            RentalRequest request = rentalRequestService.approveRequest(id, userDetails.getUser().getId());
            return ResponseEntity.ok(RentalRequestDto.fromEntity(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectRequest(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            RentalRequest request = rentalRequestService.rejectRequest(id, userDetails.getUser().getId());
            return ResponseEntity.ok(RentalRequestDto.fromEntity(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelRequest(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            RentalRequest request = rentalRequestService.cancelRequest(id, userDetails.getUser().getId());
            return ResponseEntity.ok(RentalRequestDto.fromEntity(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/resend")
    public ResponseEntity<?> resendRequest(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            RentalRequest request = rentalRequestService.resendRequest(id, userDetails.getUser().getId());
            return ResponseEntity.ok(RentalRequestDto.fromEntity(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
