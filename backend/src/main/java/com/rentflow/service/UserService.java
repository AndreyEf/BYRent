package com.rentflow.service;

import com.rentflow.dto.*;
import com.rentflow.entity.User;
import com.rentflow.entity.SubscriptionPlan;
import com.rentflow.entity.UserSubscription;
import com.rentflow.repository.SubscriptionPlanRepository;
import com.rentflow.repository.UserRepository;
import com.rentflow.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Пользователь с таким email уже существует");
        }

        String visibleId = generateVisibleId();
        while (userRepository.existsByVisibleId(visibleId)) {
            visibleId = generateVisibleId();
        }

        User user = User.builder()
            .id(UUID.randomUUID().toString())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .visibleId(visibleId)
            .firstName(request.getFirstName())
            .lastName(request.getLastName())
            .phone(request.getPhone())
            .isAdmin(false)
            .build();

        user = userRepository.save(user);

        // Create free subscription
        SubscriptionPlan freePlan = planRepository.findById("free")
            .orElseThrow(() -> new RuntimeException("Free plan not found"));
        
        UserSubscription subscription = UserSubscription.builder()
            .id(UUID.randomUUID().toString())
            .user(user)
            .plan(freePlan)
            .status("active")
            .build();
        subscriptionRepository.save(subscription);

        return user;
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> findById(String id) {
        return userRepository.findById(id);
    }

    public Optional<User> findByVisibleId(String visibleId) {
        return userRepository.findByVisibleId(visibleId);
    }

    @Transactional
    public User updateProfile(String userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        return userRepository.save(user);
    }

    @Transactional
    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Неверный текущий пароль");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private String generateVisibleId() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder result = new StringBuilder();
        for (int i = 0; i < 8; i++) {
            result.append(chars.charAt((int) (Math.random() * chars.length())));
        }
        return result.toString();
    }
}
