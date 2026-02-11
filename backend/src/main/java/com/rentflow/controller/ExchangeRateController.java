package com.rentflow.controller;

import com.rentflow.service.ExchangeRateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/exchange-rate")
@RequiredArgsConstructor
public class ExchangeRateController {
    
    private final ExchangeRateService exchangeRateService;
    
    @GetMapping
    public ResponseEntity<?> getExchangeRate() {
        BigDecimal usdRate = exchangeRateService.getUsdRate();
        return ResponseEntity.ok(Map.of(
            "currency", "USD",
            "rate", usdRate,
            "baseCurrency", "BYN"
        ));
    }
}
