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
        // Individual plans
        if (!subscriptionPlanRepository.existsById("free")) {
            subscriptionPlanRepository.save(SubscriptionPlan.builder()
                .id("free")
                .name("Бесплатный")
                .price(0)
                .propertyLimit(1)
                .description("1 объект недвижимости")
                .build());
        }

        if (!subscriptionPlanRepository.existsById("basic")) {
            subscriptionPlanRepository.save(SubscriptionPlan.builder()
                .id("basic")
                .name("Базовый")
                .price(2990)
                .propertyLimit(3)
                .description("До 3 объектов недвижимости")
                .build());
        }

        if (!subscriptionPlanRepository.existsById("standard")) {
            subscriptionPlanRepository.save(SubscriptionPlan.builder()
                .id("standard")
                .name("Стандартный")
                .price(4990)
                .propertyLimit(5)
                .description("До 5 объектов недвижимости")
                .build());
        }

        if (!subscriptionPlanRepository.existsById("premium")) {
            subscriptionPlanRepository.save(SubscriptionPlan.builder()
                .id("premium")
                .name("Премиум")
                .price(9990)
                .propertyLimit(-1)
                .description("Неограниченное количество объектов")
                .build());
        }

        // Organization plans
        if (!subscriptionPlanRepository.existsById("free_org")) {
            subscriptionPlanRepository.save(SubscriptionPlan.builder()
                .id("free_org")
                .name("Бесплатный (Юр. лицо)")
                .price(0)
                .propertyLimit(3)
                .description("До 3 объектов недвижимости")
                .build());
        }

        if (!subscriptionPlanRepository.existsById("basic_org")) {
            subscriptionPlanRepository.save(SubscriptionPlan.builder()
                .id("basic_org")
                .name("Базовый (Юр. лицо)")
                .price(5000)
                .propertyLimit(5)
                .description("3-5 объектов недвижимости")
                .build());
        }

        if (!subscriptionPlanRepository.existsById("standard_org")) {
            subscriptionPlanRepository.save(SubscriptionPlan.builder()
                .id("standard_org")
                .name("Стандартный (Юр. лицо)")
                .price(10000)
                .propertyLimit(10)
                .description("5-10 объектов недвижимости")
                .build());
        }

        if (!subscriptionPlanRepository.existsById("premium_org")) {
            subscriptionPlanRepository.save(SubscriptionPlan.builder()
                .id("premium_org")
                .name("Премиум (Юр. лицо)")
                .price(20000)
                .propertyLimit(-1)
                .description("Более 10 объектов недвижимости")
                .build());
        }

        log.info("[init] Subscription plans initialized (prices in BYN kopecks)");
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
