package com.rentflow.dto;

import com.rentflow.entity.EmailTemplate;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class EmailTemplateResponse {
    private String id;
    private String code;
    private String name;
    private String subject;
    private String body;
    private String description;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static EmailTemplateResponse fromEntity(EmailTemplate template) {
        return EmailTemplateResponse.builder()
            .id(template.getId())
            .code(template.getCode())
            .name(template.getName())
            .subject(template.getSubject())
            .body(template.getBody())
            .description(template.getDescription())
            .isActive(template.getIsActive())
            .createdAt(template.getCreatedAt())
            .updatedAt(template.getUpdatedAt())
            .build();
    }
}
