package com.rentflow.controller;

import com.rentflow.dto.*;
import com.rentflow.entity.User;
import com.rentflow.security.CustomUserDetails;
import com.rentflow.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request, 
                                       HttpServletRequest httpRequest,
                                       HttpServletResponse httpResponse) {
        try {
            User user = userService.register(request);
            
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
            
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, httpRequest, httpResponse);

            return ResponseEntity.ok(UserResponse.fromEntity(user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/register-organization")
    public ResponseEntity<?> registerOrganization(@Valid @RequestBody RegisterOrganizationRequest request, 
                                                   HttpServletRequest httpRequest,
                                                   HttpServletResponse httpResponse) {
        try {
            User user = userService.registerOrganization(request);
            
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
            
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, httpRequest, httpResponse);

            return ResponseEntity.ok(UserResponse.fromEntity(user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, 
                                    HttpServletRequest httpRequest,
                                    HttpServletResponse httpResponse) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
            
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, httpRequest, httpResponse);

            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            return ResponseEntity.ok(UserResponse.fromEntity(userDetails.getUser()));
        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("message", "Неверный email или пароль"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Не авторизован"));
        }
        User freshUser = userService.findById(userDetails.getUser().getId())
            .orElse(null);
        if (freshUser == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Пользователь не найден"));
        }
        return ResponseEntity.ok(UserResponse.fromEntity(freshUser));
    }

    @PostMapping("/login-phone")
    public ResponseEntity<?> loginByPhone(@Valid @RequestBody LoginPhoneRequest request, 
                                          HttpServletRequest httpRequest,
                                          HttpServletResponse httpResponse) {
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

            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getEmail(), request.getPassword())
            );
            
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            securityContextRepository.saveContext(context, httpRequest, httpResponse);

            return ResponseEntity.ok(UserResponse.fromEntity(user));
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(Map.of("message", e.getMessage()));
        }
    }
}
