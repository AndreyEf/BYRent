package com.rentflow.service;

import com.rentflow.entity.SubscriptionPlan;
import com.rentflow.entity.User;
import com.rentflow.entity.UserSubscription;
import com.rentflow.repository.PropertyRepository;
import com.rentflow.repository.SubscriptionPlanRepository;
import com.rentflow.repository.UserRepository;
import com.rentflow.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SubscriptionService {
    private final SubscriptionPlanRepository planRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final EmailService emailService;

    public List<SubscriptionPlan> getAllPlans() {
        return planRepository.findAllByOrderByPriceAsc();
    }

    public UserSubscription getSubscription(UUID userId) {
        return subscriptionRepository.findByUserId(userId).orElse(null);
    }

    public int getPropertyLimit(UUID userId) {
        UserSubscription subscription = subscriptionRepository.findByUserId(userId).orElse(null);
        if (subscription != null && subscription.getPlan() != null) {
            return subscription.getPlan().getPropertyLimit();
        }
        return 1; // default free limit
    }

    public long getPropertyCount(UUID userId) {
        return propertyRepository.countByOwnerId(userId);
    }

    @Transactional
    public UserSubscription activateSubscription(UUID userId, String planId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        SubscriptionPlan plan = planRepository.findById(planId)
            .orElseThrow(() -> new RuntimeException("Тариф не найден"));

        UserSubscription subscription = subscriptionRepository.findByUserId(userId)
            .orElse(UserSubscription.builder()
                .user(user)
                .build());

        subscription.setPlan(plan);
        subscription.setStatus("active");
        subscription.setStartDate(LocalDateTime.now());
        subscription.setEndDate(null);

        UserSubscription saved = subscriptionRepository.save(subscription);

        emailService.sendSubscriptionChangedEmail(user.getEmail(), user.getFirstName(), plan.getName());

        return saved;
    }

    @Transactional
    public UserSubscription cancelSubscription(UUID userId) {
        UserSubscription subscription = subscriptionRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("Подписка не найдена"));

        // Downgrade to free plan
        SubscriptionPlan freePlan = planRepository.findById("free")
            .orElseThrow(() -> new RuntimeException("Free plan not found"));

        subscription.setPlan(freePlan);
        subscription.setStatus("active");

        UserSubscription saved = subscriptionRepository.save(subscription);

        emailService.sendSubscriptionChangedEmail(
            subscription.getUser().getEmail(), 
            subscription.getUser().getFirstName(), 
            freePlan.getName()
        );

        return saved;
    }
}
