package com.rentflow.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Map;

@Service
@Slf4j
public class ExchangeRateService {
    
    private static final String NBRB_API_URL = "https://api.nbrb.by/exrates/rates/431";
    private static final long CACHE_DURATION_HOURS = 1;
    
    private BigDecimal cachedUsdRate = null;
    private LocalDateTime cacheTime = null;
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    public BigDecimal getUsdRate() {
        if (cachedUsdRate != null && cacheTime != null 
            && cacheTime.plusHours(CACHE_DURATION_HOURS).isAfter(LocalDateTime.now())) {
            return cachedUsdRate;
        }
        
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(NBRB_API_URL, Map.class);
            if (response != null && response.containsKey("Cur_OfficialRate")) {
                Object rate = response.get("Cur_OfficialRate");
                cachedUsdRate = new BigDecimal(rate.toString());
                cacheTime = LocalDateTime.now();
                log.info("[exchange] USD rate updated: {}", cachedUsdRate);
                return cachedUsdRate;
            }
        } catch (Exception e) {
            log.error("[exchange] Failed to fetch USD rate", e);
        }
        
        if (cachedUsdRate != null) {
            return cachedUsdRate;
        }
        return new BigDecimal("3.27");
    }
    
    public BigDecimal convertBynToUsd(BigDecimal bynAmount) {
        BigDecimal rate = getUsdRate();
        return bynAmount.divide(rate, 2, RoundingMode.HALF_UP);
    }
}
