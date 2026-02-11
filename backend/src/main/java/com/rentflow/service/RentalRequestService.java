package com.rentflow.service;

import com.rentflow.entity.Property;
import com.rentflow.entity.RentalRequest;
import com.rentflow.entity.TenantHistory;
import com.rentflow.entity.User;
import com.rentflow.repository.PropertyRepository;
import com.rentflow.repository.RentalRequestRepository;
import com.rentflow.repository.TenantHistoryRepository;
import com.rentflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RentalRequestService {
    private final RentalRequestRepository rentalRequestRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final TenantHistoryRepository tenantHistoryRepository;

    public List<RentalRequest> getRequestsByRequester(UUID requesterId) {
        return rentalRequestRepository.findByRequesterId(requesterId);
    }

    public List<RentalRequest> getRequestsByPropertyOwner(UUID ownerId) {
        return rentalRequestRepository.findByPropertyOwnerId(ownerId);
    }

    public List<RentalRequest> getRequestsByProperty(Long propertyId) {
        return rentalRequestRepository.findByPropertyId(propertyId);
    }

    @Transactional
    public RentalRequest createRequest(UUID requesterId, Long propertyId) {
        Property property = propertyRepository.findById(propertyId)
            .orElseThrow(() -> new RuntimeException("Объект не найден"));

        User requester = userRepository.findById(requesterId)
            .orElseThrow(() -> new RuntimeException("Пользователь не найден"));

        if (property.getOwner().getId().equals(requesterId)) {
            throw new RuntimeException("Нельзя подать заявку на собственный объект");
        }

        if (property.getCurrentTenant() != null) {
            throw new RuntimeException("Объект уже арендован");
        }

        if (rentalRequestRepository.existsByPropertyIdAndRequesterIdAndStatus(propertyId, requesterId, "pending")) {
            throw new RuntimeException("Вы уже подали заявку на этот объект");
        }

        RentalRequest request = RentalRequest.builder()
            .property(property)
            .requester(requester)
            .status("pending")
            .build();

        return rentalRequestRepository.save(request);
    }

    @Transactional
    public RentalRequest approveRequest(Long requestId, UUID ownerId) {
        RentalRequest request = rentalRequestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Заявка не найдена"));

        if (!request.getProperty().getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Доступ запрещён");
        }

        if (!request.getStatus().equals("pending")) {
            throw new RuntimeException("Заявка уже обработана");
        }

        Property property = request.getProperty();
        if (property.getCurrentTenant() != null) {
            throw new RuntimeException("Объект уже арендован");
        }

        // Set tenant
        property.setCurrentTenant(request.getRequester());
        propertyRepository.save(property);

        // Create tenant history
        TenantHistory history = TenantHistory.builder()
            .property(property)
            .tenant(request.getRequester())
            .startDate(LocalDateTime.now())
            .build();
        tenantHistoryRepository.save(history);

        // Update request status
        request.setStatus("approved");
        rentalRequestRepository.save(request);

        // Reject other pending requests for this property
        List<RentalRequest> otherRequests = rentalRequestRepository.findByPropertyId(property.getId());
        for (RentalRequest other : otherRequests) {
            if (other.getStatus().equals("pending")) {
                other.setStatus("rejected");
                rentalRequestRepository.save(other);
            }
        }

        return request;
    }

    @Transactional
    public RentalRequest rejectRequest(Long requestId, UUID ownerId) {
        RentalRequest request = rentalRequestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Заявка не найдена"));

        if (!request.getProperty().getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Доступ запрещён");
        }

        if (!request.getStatus().equals("pending")) {
            throw new RuntimeException("Заявка уже обработана");
        }

        request.setStatus("rejected");
        return rentalRequestRepository.save(request);
    }

    @Transactional
    public RentalRequest cancelRequest(Long requestId, UUID requesterId) {
        RentalRequest request = rentalRequestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Заявка не найдена"));

        if (!request.getRequester().getId().equals(requesterId)) {
            throw new RuntimeException("Доступ запрещён");
        }

        if (!request.getStatus().equals("pending")) {
            throw new RuntimeException("Заявку нельзя отменить");
        }

        request.setStatus("cancelled");
        return rentalRequestRepository.save(request);
    }

    @Transactional
    public RentalRequest resendRequest(Long requestId, UUID requesterId) {
        RentalRequest oldRequest = rentalRequestRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Заявка не найдена"));

        if (!oldRequest.getRequester().getId().equals(requesterId)) {
            throw new RuntimeException("Доступ запрещён");
        }

        if (!oldRequest.getStatus().equals("rejected") && !oldRequest.getStatus().equals("cancelled")) {
            throw new RuntimeException("Можно повторить только отклонённую или отменённую заявку");
        }

        Property property = oldRequest.getProperty();
        if (property.getCurrentTenant() != null) {
            throw new RuntimeException("Объект уже арендован");
        }

        RentalRequest newRequest = RentalRequest.builder()
            .property(property)
            .requester(oldRequest.getRequester())
            .status("pending")
            .build();

        return rentalRequestRepository.save(newRequest);
    }
}
