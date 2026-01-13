package com.rentflow.dto;

import com.rentflow.entity.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserResponse {
    private String id;
    private String email;
    private String visibleId;
    private String firstName;
    private String lastName;
    private String phone;
    private Boolean isAdmin;

    public static UserResponse fromEntity(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .visibleId(user.getVisibleId())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .phone(user.getPhone())
            .isAdmin(user.getIsAdmin())
            .build();
    }
}
