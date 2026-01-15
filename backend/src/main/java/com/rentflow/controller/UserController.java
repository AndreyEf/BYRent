package com.rentflow.controller;

import com.rentflow.dto.*;
import com.rentflow.entity.User;
import com.rentflow.security.CustomUserDetails;
import com.rentflow.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @PatchMapping("/me")
    public ResponseEntity<?> updateProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpdateUserRequest request) {
        try {
            User updated = userService.updateProfile(userDetails.getUser().getId(), request);
            return ResponseEntity.ok(UserResponse.fromEntity(updated));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/me/password")
    public ResponseEntity<?> changePassword(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        try {
            userService.changePassword(userDetails.getUser().getId(), request);
            return ResponseEntity.ok(Map.of("message", "Пароль успешно изменён"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchUser(
            @RequestParam(required = false) String visibleId,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone) {
        
        java.util.Optional<User> user = java.util.Optional.empty();
        
        if (visibleId != null && !visibleId.isBlank()) {
            user = userService.findByVisibleId(visibleId.trim().toUpperCase());
        } else if (email != null && !email.isBlank()) {
            user = userService.findByEmail(email.trim().toLowerCase());
        } else if (phone != null && !phone.isBlank()) {
            user = userService.findByPhone(phone.trim());
        }
        
        return user
            .map(u -> ResponseEntity.ok(UserResponse.fromEntity(u)))
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable String id) {
        return userService.findById(id)
            .map(user -> ResponseEntity.ok(UserResponse.fromEntity(user)))
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/me/verify-phone")
    public ResponseEntity<?> verifyPhone(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody VerifyPhoneRequest request) {
        try {
            User updated = userService.verifyPhone(userDetails.getUser().getId(), request.getPhone());
            return ResponseEntity.ok(UserResponse.fromEntity(updated));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
