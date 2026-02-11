package com.rentflow.controller;

import com.rentflow.dto.*;
import com.rentflow.entity.User;
import com.rentflow.security.CustomUserDetails;
import com.rentflow.security.JwtService;
import com.rentflow.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            User user = userService.register(request);
            String token = jwtService.generateToken(user);
            return ResponseEntity.ok(Map.of(
                "user", UserResponse.fromEntity(user),
                "token", token
            ));
        } catch (RuntimeException e) {
            log.error("register failed", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/register-organization")
    public ResponseEntity<?> registerOrganization(@Valid @RequestBody RegisterOrganizationRequest request) {
        try {
            User user = userService.registerOrganization(request);
            String token = jwtService.generateToken(user);
            return ResponseEntity.ok(Map.of(
                "user", UserResponse.fromEntity(user),
                "token", token
            ));
        } catch (RuntimeException e) {
            log.error("registerOrganization failed", e);
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            User user = userDetails.user();
            String token = jwtService.generateToken(user);
            return ResponseEntity.ok(Map.of(
                "user", UserResponse.fromEntity(user),
                "token", token
            ));
        } catch (Exception e) {
            log.error("login failed", e);
            return ResponseEntity.status(401).body(Map.of("message", "Неверный email или пароль"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Не авторизован"));
        }
        User freshUser = userService.findById(userDetails.user().getId())
            .orElse(null);
        if (freshUser == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Пользователь не найден"));
        }
        return ResponseEntity.ok(UserResponse.fromEntity(freshUser));
    }

    @PostMapping("/login-phone")
    public ResponseEntity<?> loginByPhone(@Valid @RequestBody LoginPhoneRequest request) {
        try {
            User user = userService.findByPhone(request.getPhone())
                .orElseThrow(() -> new RuntimeException("Пользователь с таким телефоном не найден"));

            if (Boolean.TRUE.equals(user.getIsBlocked())) {
                return ResponseEntity.status(401).body(Map.of(
                    "message", "Ваш аккаунт заблокирован. Обратитесь в поддержку."
                ));
            }

            if (!Boolean.TRUE.equals(user.getPhoneVerified())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "message", "Номер телефона не подтверждён. Пожалуйста, войдите по email и подтвердите телефон."
                ));
            }

            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                return ResponseEntity.status(401).body(Map.of("message", "Неверный пароль"));
            }

            String token = jwtService.generateToken(user);
            return ResponseEntity.ok(Map.of(
                "user", UserResponse.fromEntity(user),
                "token", token
            ));
        } catch (RuntimeException e) {
            log.error("loginByPhone failed", e);
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }
}
