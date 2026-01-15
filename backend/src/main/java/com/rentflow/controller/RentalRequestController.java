package com.rentflow.controller;

import com.rentflow.dto.RentalRequestDto;
import com.rentflow.entity.RentalRequest;
import com.rentflow.entity.User;
import com.rentflow.security.CustomUserDetails;
import com.rentflow.service.RentalRequestService;
import com.rentflow.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class RentalRequestController {
    private final RentalRequestService rentalRequestService;
    private final UserService userService;

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
            User freshUser = userService.findById(userDetails.getUser().getId())
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
            
            if (!Boolean.TRUE.equals(freshUser.getPhoneVerified())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "message", "Для отправки заявки на аренду необходимо подтвердить номер телефона",
                    "requiresPhoneVerification", true
                ));
            }
            String propertyId = body.get("propertyId");
            RentalRequest request = rentalRequestService.createRequest(
                freshUser.getId(), propertyId);
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
            User freshUser = userService.findById(userDetails.getUser().getId())
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
            
            if (!Boolean.TRUE.equals(freshUser.getPhoneVerified())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "message", "Для добавления арендатора необходимо подтвердить номер телефона",
                    "requiresPhoneVerification", true
                ));
            }
            RentalRequest request = rentalRequestService.approveRequest(id, freshUser.getId());
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
