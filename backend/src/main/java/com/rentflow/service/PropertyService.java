package com.rentflow.service;

import com.rentflow.dto.PropertyRequest;
import com.rentflow.entity.Property;
import com.rentflow.entity.User;
import com.rentflow.entity.UserSubscription;
import com.rentflow.repository.PropertyRepository;
import com.rentflow.repository.UserRepository;
import com.rentflow.repository.UserSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PropertyService {
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final UserSubscriptionRepository subscriptionRepository;

    public List<Property> getPropertiesByOwner(String ownerId) {
        return propertyRepository.findByOwnerId(ownerId);
    }

    public List<Property> getRentedProperties(String tenantId) {
        return propertyRepository.findByCurrentTenantId(tenantId);
    }

    public List<Property> getAvailableProperties(String userId) {
        return propertyRepository.findAvailablePropertiesExcludingOwner(userId);
    }

    public Property getPropertyById(String id) {
        return propertyRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Объект не найден"));
    }

    @Transactional
    public Property createProperty(String ownerId, PropertyRequest request) {
        User owner = userRepository.findById(ownerId)
            .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        // Check subscription limit
        UserSubscription subscription = subscriptionRepository.findByUserId(ownerId)
            .orElse(null);
        
        int propertyLimit = 1; // default free limit
        if (subscription != null && subscription.getPlan() != null) {
            propertyLimit = subscription.getPlan().getPropertyLimit();
        }

        if (propertyLimit != -1) { // -1 means unlimited
            long currentCount = propertyRepository.countByOwnerId(ownerId);
            if (currentCount >= propertyLimit) {
                throw new RuntimeException("Достигнут лимит объектов для вашего тарифа. Перейдите на более высокий тариф.");
            }
        }

        Property property = Property.builder()
            .id(UUID.randomUUID().toString())
            .owner(owner)
            .address(request.getAddress())
            .ownerFullName(request.getOwnerFullName())
            .cadastralNumber(request.getCadastralNumber())
            .description(request.getDescription())
            .photos(request.getPhotos() != null ? request.getPhotos().toArray(new String[0]) : null)
            .rentPrice(request.getRentPrice())
            .utilityPayments(request.getUtilityPayments())
            .hoaFees(request.getHoaFees())
            .electricityCost(request.getElectricityCost())
            .additionalInfo(request.getAdditionalInfo())
            .contractFile(request.getContractFile())
            .build();

        return propertyRepository.save(property);
    }

    @Transactional
    public Property updateProperty(String propertyId, String ownerId, PropertyRequest request) {
        Property property = propertyRepository.findById(propertyId)
            .orElseThrow(() -> new RuntimeException("Объект не найден"));

        if (!property.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Доступ запрещён");
        }

        property.setAddress(request.getAddress());
        property.setOwnerFullName(request.getOwnerFullName());
        property.setCadastralNumber(request.getCadastralNumber());
        property.setDescription(request.getDescription());
        property.setPhotos(request.getPhotos() != null ? request.getPhotos().toArray(new String[0]) : null);
        property.setRentPrice(request.getRentPrice());
        property.setUtilityPayments(request.getUtilityPayments());
        property.setHoaFees(request.getHoaFees());
        property.setElectricityCost(request.getElectricityCost());
        property.setAdditionalInfo(request.getAdditionalInfo());
        property.setContractFile(request.getContractFile());

        return propertyRepository.save(property);
    }

    @Transactional
    public void deleteProperty(String propertyId, String ownerId) {
        Property property = propertyRepository.findById(propertyId)
            .orElseThrow(() -> new RuntimeException("Объект не найден"));

        if (!property.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Доступ запрещён");
        }

        propertyRepository.delete(property);
    }

    @Transactional
    public Property removeTenant(String propertyId, String ownerId) {
        Property property = propertyRepository.findById(propertyId)
            .orElseThrow(() -> new RuntimeException("Объект не найден"));

        if (!property.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Доступ запрещён");
        }

        property.setCurrentTenant(null);
        return propertyRepository.save(property);
    }
}
