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
    private final EmailService emailService;

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
            .userType("individual")
            .isAdmin(false)
            .build();

        user = userRepository.save(user);

        // Create free subscription for individuals
        SubscriptionPlan freePlan = planRepository.findById("free")
            .orElseThrow(() -> new RuntimeException("Free plan not found"));
        
        UserSubscription subscription = UserSubscription.builder()
            .id(UUID.randomUUID().toString())
            .user(user)
            .plan(freePlan)
            .status("active")
            .build();
        subscriptionRepository.save(subscription);

        emailService.sendRegistrationEmail(user.getEmail(), user.getFirstName());

        return user;
    }

    @Transactional
    public User registerOrganization(RegisterOrganizationRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Пользователь с таким email уже существует");
        }

        if (userRepository.existsByUnp(request.getUnp())) {
            throw new RuntimeException("Организация с таким УНП уже зарегистрирована");
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
            .firstName(request.getOrganizationName())
            .lastName("")
            .phone(request.getPhone())
            .userType("organization")
            .organizationName(request.getOrganizationName())
            .unp(request.getUnp())
            .phoneVerified(true)
            .isAdmin(false)
            .build();

        user = userRepository.save(user);

        // Create free subscription for organizations
        SubscriptionPlan freeOrgPlan = planRepository.findById("free_org")
            .orElseThrow(() -> new RuntimeException("Free organization plan not found"));
        
        UserSubscription subscription = UserSubscription.builder()
            .id(UUID.randomUUID().toString())
            .user(user)
            .plan(freeOrgPlan)
            .status("active")
            .build();
        subscriptionRepository.save(subscription);

        emailService.sendRegistrationEmail(user.getEmail(), user.getOrganizationName());

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

    public Optional<User> findByPhone(String phone) {
        return userRepository.findByPhone(phone);
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

        emailService.sendPasswordChangedEmail(user.getEmail(), user.getFirstName());
    }

    @Transactional
    public User verifyPhone(String userId, String phone) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        // Check if phone is already used by another user
        Optional<User> existingUser = userRepository.findByPhone(phone);
        if (existingUser.isPresent() && !existingUser.get().getId().equals(userId)) {
            throw new RuntimeException("Этот номер телефона уже используется другим пользователем");
        }

        user.setPhone(phone);
        user.setPhoneVerified(true);
        return userRepository.save(user);
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
