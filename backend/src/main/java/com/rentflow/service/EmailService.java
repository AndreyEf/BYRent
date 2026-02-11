package com.rentflow.service;

import com.rentflow.entity.EmailTemplate;
import com.rentflow.repository.EmailTemplateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    private final EmailTemplateRepository templateRepository;

    public List<EmailTemplate> getAllTemplates() {
        return templateRepository.findAllByOrderByNameAsc();
    }

    public Optional<EmailTemplate> getTemplateByCode(String code) {
        return templateRepository.findByCode(code);
    }

    public Optional<EmailTemplate> getTemplateById(String id) {
        return templateRepository.findById(id);
    }

    @Transactional
    public EmailTemplate saveTemplate(EmailTemplate template) {
        return templateRepository.save(template);
    }

    @Transactional
    public void deleteTemplate(String id) {
        templateRepository.deleteById(id);
    }

    public void sendEmail(String to, String templateCode, Map<String, String> variables) {
        Optional<EmailTemplate> templateOpt = templateRepository.findByCode(templateCode);
        if (templateOpt.isEmpty()) {
            log.warn("Email template not found: {}", templateCode);
            return;
        }

        EmailTemplate template = templateOpt.get();
        if (!Boolean.TRUE.equals(template.getIsActive())) {
            log.info("Email template is disabled: {}", templateCode);
            return;
        }

        String subject = replaceVariables(template.getSubject(), variables);
        String body = replaceVariables(template.getBody(), variables);

        log.info("Sending email to: {}", to);
        log.info("Subject: {}", subject);
        log.info("Body: {}", body);
    }

    public void sendRegistrationEmail(String email, String firstName) {
        sendEmail(email, "registration", Map.of(
            "firstName", firstName != null ? firstName : "",
            "email", email
        ));
    }

    public void sendPasswordChangedEmail(String email, String firstName) {
        sendEmail(email, "password_changed", Map.of(
            "firstName", firstName != null ? firstName : "",
            "email", email
        ));
    }

    public void sendSubscriptionChangedEmail(String email, String firstName, String planName) {
        sendEmail(email, "subscription_changed", Map.of(
            "firstName", firstName != null ? firstName : "",
            "email", email,
            "planName", planName != null ? planName : ""
        ));
    }

    private String replaceVariables(String text, Map<String, String> variables) {
        if (text == null) return "";
        String result = text;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            result = result.replace("{{" + entry.getKey() + "}}", entry.getValue());
        }
        return result;
    }

    @Transactional
    public void initializeDefaultTemplates() {
        if (templateRepository.count() == 0) {
            log.info("Initializing default email templates...");

            saveTemplate(EmailTemplate.builder()
                .code("registration")
                .name("Регистрация")
                .subject("Добро пожаловать в BYRent!")
                .body("""
                    Здравствуйте, {{firstName}}!
                    
                    Добро пожаловать в BYRent - сервис для аренды недвижимости в Беларуси.
                    
                    Ваш аккаунт успешно создан. Теперь вы можете:
                    - Размещать объекты недвижимости
                    - Искать арендаторов и арендодателей
                    - Управлять заявками на аренду
                    
                    Спасибо, что выбрали BYRent!
                    
                    С уважением,
                    Команда BYRent
                    """)
                .description("Отправляется при регистрации нового пользователя. Переменные: {{firstName}}, {{email}}")
                .isActive(true)
                .build());

            saveTemplate(EmailTemplate.builder()
                .code("password_changed")
                .name("Смена пароля")
                .subject("Пароль успешно изменён")
                .body("""
                    Здравствуйте, {{firstName}}!
                    
                    Пароль вашего аккаунта BYRent был успешно изменён.
                    
                    Если вы не меняли пароль, немедленно свяжитесь с нашей поддержкой.
                    
                    С уважением,
                    Команда BYRent
                    """)
                .description("Отправляется при смене пароля. Переменные: {{firstName}}, {{email}}")
                .isActive(true)
                .build());

            saveTemplate(EmailTemplate.builder()
                .code("subscription_changed")
                .name("Смена тарифа")
                .subject("Тарифный план изменён")
                .body("""
                    Здравствуйте, {{firstName}}!
                    
                    Ваш тарифный план в BYRent был изменён.
                    
                    Новый тариф: {{planName}}
                    
                    Спасибо за использование BYRent!
                    
                    С уважением,
                    Команда BYRent
                    """)
                .description("Отправляется при смене тарифного плана. Переменные: {{firstName}}, {{email}}, {{planName}}")
                .isActive(true)
                .build());

            log.info("Default email templates initialized.");
        }
    }
}
