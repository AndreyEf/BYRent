package com.rentflow.dto;

import com.rentflow.entity.Property;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Data
@Builder
public class PropertyResponse {
    private String id;
    private String ownerId;
    private String city;
    private String street;
    private String building;
    private String block;
    private String apartment;
    private String fullAddress;
    private String ownerFullName;
    private String cadastralNumber;
    private String description;
    private List<String> photos;
    private Integer rentPrice;
    private String utilityPayments;
    private String hoaFees;
    private String electricityCost;
    private String additionalInfo;
    private String contractFile;
    private Double latitude;
    private Double longitude;
    private String currentTenantId;
    private LocalDateTime createdAt;
    private UserResponse owner;
    private UserResponse currentTenant;

    public static PropertyResponse fromEntity(Property property) {
        PropertyResponseBuilder builder = PropertyResponse.builder()
            .id(property.getId())
            .ownerId(property.getOwner().getId())
            .city(property.getCity())
            .street(property.getStreet())
            .building(property.getBuilding())
            .block(property.getBlock())
            .apartment(property.getApartment())
            .fullAddress(property.getFullAddress())
            .ownerFullName(property.getOwnerFullName())
            .cadastralNumber(property.getCadastralNumber())
            .description(property.getDescription())
            .photos(property.getPhotos() != null ? Arrays.asList(property.getPhotos()) : null)
            .rentPrice(property.getRentPrice())
            .utilityPayments(property.getUtilityPayments())
            .hoaFees(property.getHoaFees())
            .electricityCost(property.getElectricityCost())
            .additionalInfo(property.getAdditionalInfo())
            .contractFile(property.getContractFile())
            .latitude(property.getLatitude())
            .longitude(property.getLongitude())
            .currentTenantId(property.getCurrentTenant() != null ? property.getCurrentTenant().getId() : null)
            .createdAt(property.getCreatedAt())
            .owner(UserResponse.fromEntity(property.getOwner()));

        if (property.getCurrentTenant() != null) {
            builder.currentTenant(UserResponse.fromEntity(property.getCurrentTenant()));
        }

        return builder.build();
    }
}
