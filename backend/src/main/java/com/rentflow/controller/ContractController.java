package com.rentflow.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.io.IOException;

@RestController
@RequestMapping("/api")
@Slf4j
public class ContractController {

    @GetMapping("/contract-template")
    public ResponseEntity<Resource> downloadContractTemplate() {
        try {
            Resource resource = new ClassPathResource("contract-template.doc");
            if (!resource.exists()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, 
                    "attachment; filename=\"Типовой_договор_найма.doc\"")
                .body(resource);
        } catch (Exception e) {
            log.error("Contract template download error", e);
            return ResponseEntity.notFound().build();
        }
    }
}
