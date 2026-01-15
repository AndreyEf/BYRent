package com.rentflow.config;

import com.rentflow.entity.SubscriptionPlan;
import com.rentflow.entity.User;
import com.rentflow.repository.SubscriptionPlanRepository;
import com.rentflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {
    private final UserRepository userRepository;
    private final SubscriptionPlanRepository subscriptionPlanRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.password}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        initSubscriptionPlans();
        initAdminUser();
    }

    private void initSubscriptionPlans() {
        if (subscriptionPlanRepository.count() == 0) {
            subscriptionPlanRepository.save(SubscriptionPlan.builder()
                .id("free")
                .name("Бесплатный")
                .price(0)
                .propertyLimit(1)
                .description("1 объект недвижимости")
                .build());

            subscriptionPlanRepository.save(SubscriptionPlan.builder()
                .id("basic")
                .name("Базовый")
                .price(2990)
                .propertyLimit(3)
                .description("До 3 объектов недвижимости")
                .build());

            subscriptionPlanRepository.save(SubscriptionPlan.builder()
                .id("standard")
                .name("Стандартный")
                .price(4990)
                .propertyLimit(5)
                .description("До 5 объектов недвижимости")
                .build());

            subscriptionPlanRepository.save(SubscriptionPlan.builder()
                .id("premium")
                .name("Премиум")
                .price(9990)
                .propertyLimit(-1)
                .description("Неограниченное количество объектов")
                .build());

            log.info("[init] Subscription plans created (prices in BYN kopecks)");
        }
    }

    private void initAdminUser() {
        if (!userRepository.existsByEmail("admin@byrent.by")) {
            String visibleId = generateVisibleId();
            User admin = User.builder()
                .id(UUID.randomUUID().toString())
                .email("admin@byrent.by")
                .password(passwordEncoder.encode(adminPassword))
                .visibleId(visibleId)
                .firstName("Admin")
                .lastName("BYRent")
                .phone("+375291234567")
                .phoneVerified(true)
                .isAdmin(true)
                .build();
            userRepository.save(admin);
            log.info("[admin] Admin account created: admin@byrent.by");
        } else {
            log.info("[admin] Admin account already exists");
        }
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
