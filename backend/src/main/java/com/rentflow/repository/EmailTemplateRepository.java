package com.rentflow.repository;

import com.rentflow.entity.EmailTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, String> {
    Optional<EmailTemplate> findByCode(String code);
    List<EmailTemplate> findAllByOrderByNameAsc();
}
