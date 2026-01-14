package com.rentflow.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "properties")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Property {
    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "uuid2")
    @Column(columnDefinition = "varchar(36)")
    private String id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false)
    private String address;

    @Column(name = "owner_full_name", nullable = false)
    private String ownerFullName;

    @Column(name = "cadastral_number", nullable = false)
    private String cadastralNumber;

    private String description;

    @Column(columnDefinition = "text[]")
    private String[] photos;

    @Column(name = "rent_price")
    private Integer rentPrice;

    @Column(name = "utility_payments")
    private String utilityPayments;

    @Column(name = "hoa_fees")
    private String hoaFees;

    @Column(name = "electricity_cost")
    private String electricityCost;

    @Column(name = "additional_info", length = 4096)
    private String additionalInfo;

    @Column(name = "contract_file")
    private String contractFile;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_tenant_id")
    private User currentTenant;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @JsonIgnore
    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL)
    private List<RentalRequest> rentalRequests;

    @JsonIgnore
    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL)
    private List<TenantHistory> tenantHistory;

    @JsonIgnore
    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL)
    private List<Review> reviews;
}
