package com.rentflow.controller;

import com.rentflow.dto.RentalRequestDto;
import com.rentflow.entity.RentalRequest;
import com.rentflow.entity.User;
import com.rentflow.security.CustomUserDetails;
import com.rentflow.service.RentalRequestService;
import com.rentflow.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
@Slf4j
public class RentalRequestController {
    private final RentalRequestService rentalRequestService;
    private final UserService userService;

    @GetMapping("/my")
    public ResponseEntity<List<RentalRequestDto>> getMyRequests(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<RentalRequest> requests = rentalRequestService.getRequestsByRequester(userDetails.user().getId());
        return ResponseEntity.ok(requests.stream()
            .map(RentalRequestDto::fromEntity)
            .collect(Collectors.toList()));
    }

    @GetMapping("/incoming")
    public ResponseEntity<List<RentalRequestDto>> getIncomingRequests(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<RentalRequest> requests = rentalRequestService.getRequestsByPropertyOwner(userDetails.user().getId());
        return ResponseEntity.ok(requests.stream()
            .map(RentalRequestDto::fromEntity)
            .collect(Collectors.toList()));
    }

    @GetMapping("/property/{propertyId}")
    public ResponseEntity<List<RentalRequestDto>> getPropertyRequests(@PathVariable Long propertyId) {
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
            User freshUser = userService.findById(userDetails.user().getId())
                .orElseThrow(() -> new RuntimeException("Пользователь не найден"));
            
            if (!Boolean.TRUE.equals(freshUser.getPhoneVerified())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "message", "Для отправки заявки на аренду необходимо подтвердить номер телефона",
                    "requiresPhoneVerification", true
                ));
            }
            Long propertyId = Long.valueOf(body.get("propertyId"));
            RentalRequest request = rentalRequestService.createRequest(
                freshUser.getId(), propertyId);
            return ResponseEntity.ok(RentalRequestDto.fromEntity(request));
        } catch (RuntimeException e) {
            log.error("createRequest failed", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            User freshUser = userService.findById(userDetails.user().getId())
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
            log.error("approveRequest failed: id={}", id, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            RentalRequest request = rentalRequestService.rejectRequest(id, userDetails.user().getId());
            return ResponseEntity.ok(RentalRequestDto.fromEntity(request));
        } catch (RuntimeException e) {
            log.error("rejectRequest failed: id={}", id, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancelRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            RentalRequest request = rentalRequestService.cancelRequest(id, userDetails.user().getId());
            return ResponseEntity.ok(RentalRequestDto.fromEntity(request));
        } catch (RuntimeException e) {
            log.error("cancelRequest failed: id={}", id, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{id}/resend")
    public ResponseEntity<?> resendRequest(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            RentalRequest request = rentalRequestService.resendRequest(id, userDetails.user().getId());
            return ResponseEntity.ok(RentalRequestDto.fromEntity(request));
        } catch (RuntimeException e) {
            log.error("resendRequest failed: id={}", id, e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
