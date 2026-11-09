package com.nexusflow.security;

import com.sun.net.httpserver.HttpExchange;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

public class InternalAuthFilter {
    private static final Logger logger = LoggerFactory.getLogger(InternalAuthFilter.class);
    private final String expectedSecret;

    public InternalAuthFilter(String expectedSecret) {
        this.expectedSecret = expectedSecret != null ? expectedSecret : "default_nexusflow_worker_secret_2026";
    }

    public boolean authenticate(HttpExchange exchange) {
        String providedSecret = exchange.getRequestHeaders().getFirst("X-Worker-Secret");
        if (providedSecret == null || providedSecret.isBlank()) {
            logger.warn("Authentication failed: Missing X-Worker-Secret header from {}", exchange.getRemoteAddress());
            return false;
        }

        byte[] expectedBytes = expectedSecret.getBytes(StandardCharsets.UTF_8);
        byte[] providedBytes = providedSecret.getBytes(StandardCharsets.UTF_8);

        boolean matches = MessageDigest.isEqual(expectedBytes, providedBytes);
        if (!matches) {
            logger.warn("Authentication failed: Invalid X-Worker-Secret from {}", exchange.getRemoteAddress());
        }
        return matches;
    }
}
