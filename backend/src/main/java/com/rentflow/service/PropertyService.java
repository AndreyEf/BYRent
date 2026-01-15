package com.rentflow.service;

import com.rentflow.dto.PropertyRequest;
import com.rentflow.entity.Property;
import com.rentflow.entity.TenantHistory;
import com.rentflow.entity.User;
import com.rentflow.entity.UserSubscription;
import com.rentflow.repository.PropertyRepository;
import com.rentflow.repository.TenantHistoryRepository;
import com.rentflow.repository.UserRepository;
import com.rentflow.repository.UserSubscriptionRepository;
import java.time.LocalDateTime;
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
    private final TenantHistoryRepository tenantHistoryRepository;

    public List<Property> getPropertiesByOwner(String ownerId) {
        return propertyRepository.findByOwnerId(ownerId);
    }

    public List<Property> getRentedProperties(String tenantId) {
        return propertyRepository.findByCurrentTenantId(tenantId);
    }

    public List<Property> getAvailableProperties(String userId) {
        return propertyRepository.findAvailablePropertiesExcludingOwner(userId);
    }

    public List<Property> getAllAvailableProperties() {
        return propertyRepository.findAllAvailableProperties();
    }

    public Property getPropertyById(String id) {
        return propertyRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Объект не найден"));
    }

    public Property getPropertyByCadastralNumber(String cadastralNumber) {
        return propertyRepository.findByCadastralNumber(cadastralNumber)
            .orElseThrow(() -> new RuntimeException("Объект не найден"));
    }

    @Transactional
    public Property createProperty(String ownerId, PropertyRequest request) {
        User owner = userRepository.findById(ownerId)
            .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        UserSubscription subscription = subscriptionRepository.findByUserId(ownerId)
            .orElse(null);
        
        int propertyLimit = 1;
        if (subscription != null && subscription.getPlan() != null) {
            propertyLimit = subscription.getPlan().getPropertyLimit();
        }

        if (propertyLimit != -1) {
            long currentCount = propertyRepository.countActiveByOwnerId(ownerId);
            if (currentCount >= propertyLimit) {
                throw new RuntimeException("Достигнут лимит объектов для вашего тарифа. Перейдите на более высокий тариф.");
            }
        }

        Property property = Property.builder()
            .id(UUID.randomUUID().toString())
            .owner(owner)
            .city(request.getCity())
            .street(request.getStreet())
            .building(request.getBuilding())
            .block(request.getBlock())
            .apartment(request.getApartment())
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
            .latitude(request.getLatitude())
            .longitude(request.getLongitude())
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

        property.setCity(request.getCity());
        property.setStreet(request.getStreet());
        property.setBuilding(request.getBuilding());
        property.setBlock(request.getBlock());
        property.setApartment(request.getApartment());
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
        property.setLatitude(request.getLatitude());
        property.setLongitude(request.getLongitude());

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

        closeTenantHistory(propertyId);
        property.setCurrentTenant(null);
        return propertyRepository.save(property);
    }

    private void closeTenantHistory(String propertyId) {
        TenantHistory activeHistory = tenantHistoryRepository.findByPropertyIdAndEndDateIsNull(propertyId);
        if (activeHistory != null) {
            activeHistory.setEndDate(LocalDateTime.now());
            tenantHistoryRepository.save(activeHistory);
        }
    }

    public List<String> getAvailableCities() {
        return propertyRepository.findDistinctCitiesWithAvailableProperties();
    }

    @Transactional
    public Property updateVisibility(String propertyId, String ownerId, boolean isVisible) {
        Property property = propertyRepository.findById(propertyId)
            .orElseThrow(() -> new RuntimeException("Объект не найден"));

        if (!property.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Доступ запрещён");
        }

        property.setIsVisible(isVisible);
        return propertyRepository.save(property);
    }

    @Transactional
    public Property updateActiveStatus(String propertyId, String ownerId, boolean isActive) {
        Property property = propertyRepository.findById(propertyId)
            .orElseThrow(() -> new RuntimeException("Объект не найден"));

        if (!property.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Доступ запрещён");
        }

        if (!isActive && property.getCurrentTenant() != null) {
            closeTenantHistory(propertyId);
            property.setCurrentTenant(null);
        }
        
        property.setIsActive(isActive);
        return propertyRepository.save(property);
    }

    public long countActiveProperties(String ownerId) {
        return propertyRepository.countActiveByOwnerId(ownerId);
    }

    @Transactional
    public Property leaveRental(String propertyId, String tenantId) {
        Property property = propertyRepository.findById(propertyId)
            .orElseThrow(() -> new RuntimeException("Объект не найден"));

        if (property.getCurrentTenant() == null || !property.getCurrentTenant().getId().equals(tenantId)) {
            throw new RuntimeException("Вы не являетесь арендатором этого объекта");
        }

        closeTenantHistory(propertyId);
        property.setCurrentTenant(null);
        return propertyRepository.save(property);
    }
}
