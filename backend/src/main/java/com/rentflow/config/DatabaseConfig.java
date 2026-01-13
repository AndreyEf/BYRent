package com.rentflow.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

@Configuration
public class DatabaseConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Bean
    @Primary
    public DataSource dataSource() {
        String jdbcUrl = convertToJdbcUrl(databaseUrl);
        String username = extractUsername(databaseUrl);
        String password = extractPassword(databaseUrl);

        return DataSourceBuilder.create()
            .url(jdbcUrl)
            .username(username)
            .password(password)
            .driverClassName("org.postgresql.Driver")
            .build();
    }

    private String convertToJdbcUrl(String url) {
        if (url == null || url.isEmpty()) {
            return "jdbc:postgresql://localhost:5432/rentflow";
        }
        
        try {
            // Handle postgresql:// or postgres:// URL format
            if (url.startsWith("postgresql://") || url.startsWith("postgres://")) {
                URI uri = new URI(url.replace("postgresql://", "http://").replace("postgres://", "http://"));
                String host = uri.getHost();
                int port = uri.getPort() != -1 ? uri.getPort() : 5432;
                String database = uri.getPath().substring(1); // Remove leading /
                String query = uri.getQuery();
                
                String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + database;
                if (query != null && !query.isEmpty()) {
                    jdbcUrl += "?" + query;
                }
                return jdbcUrl;
            }
            
            // Already JDBC URL format
            if (url.startsWith("jdbc:")) {
                return url;
            }
            
            return "jdbc:postgresql://" + url;
        } catch (URISyntaxException e) {
            throw new RuntimeException("Invalid DATABASE_URL format: " + url, e);
        }
    }

    private String extractUsername(String url) {
        if (url == null || url.isEmpty()) {
            return "postgres";
        }
        
        try {
            URI uri = new URI(url.replace("postgresql://", "http://").replace("postgres://", "http://"));
            String userInfo = uri.getUserInfo();
            if (userInfo != null && userInfo.contains(":")) {
                return userInfo.split(":")[0];
            }
            return userInfo != null ? userInfo : "postgres";
        } catch (URISyntaxException e) {
            return "postgres";
        }
    }

    private String extractPassword(String url) {
        if (url == null || url.isEmpty()) {
            return "";
        }
        
        try {
            URI uri = new URI(url.replace("postgresql://", "http://").replace("postgres://", "http://"));
            String userInfo = uri.getUserInfo();
            if (userInfo != null && userInfo.contains(":")) {
                return userInfo.split(":")[1];
            }
            return "";
        } catch (URISyntaxException e) {
            return "";
        }
    }
}
