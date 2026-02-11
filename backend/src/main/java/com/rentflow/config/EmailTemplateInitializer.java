package com.rentflow.config;

import com.rentflow.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EmailTemplateInitializer implements CommandLineRunner {
    private final EmailService emailService;

    @Override
    public void run(String... args) {
        emailService.initializeDefaultTemplates();
    }
}
