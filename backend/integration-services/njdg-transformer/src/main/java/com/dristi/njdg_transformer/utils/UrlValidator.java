package com.dristi.njdg_transformer.utils;

import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.regex.Pattern;
import java.util.Set;

/**
 * Utility class for URL validation and sanitization to prevent SSRF attacks.
 * Validates user input before incorporating into HTTP requests.
 * Enforces an allowlist of tenant IDs for SSRF protection.
 */
@Component
public class UrlValidator {

    // Pattern for valid tenant IDs - alphanumeric with dots and hyphens
    private static final Pattern VALID_TENANT_PATTERN = Pattern.compile("^[a-zA-Z0-9][a-zA-Z0-9._-]*$");
    
    // Pattern for valid identifier strings (fileStoreId, employeeId, etc.)
    private static final Pattern VALID_IDENTIFIER_PATTERN = Pattern.compile("^[a-zA-Z0-9][a-zA-Z0-9._-]*$");
    // Whitelist for allowed tenant IDs
    private final Set<String> allowedTenantIds;

    // Constructor for injecting allowed tenant IDs
    public UrlValidator(Set<String> allowedTenantIds) {
        this.allowedTenantIds = allowedTenantIds;
    }

    
    // Maximum length for identifiers to prevent buffer overflow attacks
    private static final int MAX_IDENTIFIER_LENGTH = 256;

    /**
     * Validates and sanitizes tenant ID to prevent URL injection and SSRF.
     * Also ensures tenantId is included in allowlist.
     * 
     * @param tenantId The tenant ID to validate
     * @return The validated tenant ID
     * @throws CustomException if validation fails
     */
    public String validateTenantId(String tenantId) {
        if (tenantId == null || tenantId.trim().isEmpty()) {
            throw new CustomException("INVALID_TENANT_ID", "Tenant ID cannot be null or empty");
        }
        
        String trimmed = tenantId.trim();
        
        if (trimmed.length() > MAX_IDENTIFIER_LENGTH) {
            throw new CustomException("INVALID_TENANT_ID", "Tenant ID exceeds maximum length");
        }
        
        if (!VALID_TENANT_PATTERN.matcher(trimmed).matches()) {
            throw new CustomException("INVALID_TENANT_ID", 
                "Tenant ID contains invalid characters. Only alphanumeric, dots, hyphens, and underscores are allowed");
        }

        // SSRF whitelist enforcement
        if (allowedTenantIds != null && !allowedTenantIds.contains(trimmed)) {
            throw new CustomException("INVALID_TENANT_ID", "Tenant ID is not authorized");
        }
        
        // Check for CRLF injection attempts
        if (containsControlCharacters(trimmed)) {
            throw new CustomException("INVALID_TENANT_ID", "Tenant ID contains invalid control characters");
        }
        
        return trimmed;
    }

    /**
     * Validates and sanitizes an identifier (fileStoreId, employeeId, etc.) to prevent URL injection.
     * 
     * @param identifier The identifier to validate
     * @param identifierName The name of the identifier for error messages
     * @return The validated identifier
     * @throws CustomException if validation fails
     */
    public String validateIdentifier(String identifier, String identifierName) {
        if (identifier == null || identifier.trim().isEmpty()) {
            throw new CustomException("INVALID_" + identifierName.toUpperCase(), 
                identifierName + " cannot be null or empty");
        }
        
        String trimmed = identifier.trim();
        
        if (trimmed.length() > MAX_IDENTIFIER_LENGTH) {
            throw new CustomException("INVALID_" + identifierName.toUpperCase(), 
                identifierName + " exceeds maximum length");
        }
        
        if (!VALID_IDENTIFIER_PATTERN.matcher(trimmed).matches()) {
            throw new CustomException("INVALID_" + identifierName.toUpperCase(), 
                identifierName + " contains invalid characters. Only alphanumeric, dots, hyphens, and underscores are allowed");
        }
        
        // Check for CRLF injection attempts
        if (containsControlCharacters(trimmed)) {
            throw new CustomException("INVALID_" + identifierName.toUpperCase(), 
                identifierName + " contains invalid control characters");
        }
        
        return trimmed;
    }

    /**
     * Builds a safe URI using Spring's UriComponentsBuilder with proper encoding.
     * 
     * @param baseUrl The base URL from configuration
     * @param path The path to append
     * @param params The query parameters (key-value pairs)
     * @return The safely constructed URI string
     */
    public String buildSafeUri(String baseUrl, String path, String... params) {
        if (params.length % 2 != 0) {
            throw new IllegalArgumentException("Parameters must be provided as key-value pairs");
        }
        
        URI baseUri = URI.create(baseUrl);
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromUri(baseUri)
                .path(path);
        
        for (int i = 0; i < params.length; i += 2) {
            builder.queryParam(params[i], params[i + 1]);
        }
        
        return builder.build().encode().toUriString();
    }

    /**
     * Validates that the constructed URI points to an allowed host.
     * 
     * @param uri The URI to validate
     * @param allowedHost The allowed host from configuration
     * @return true if the URI host matches the allowed host
     */
    public boolean isAllowedHost(String uri, String allowedHost) {
        try {
            URI parsedUri = new URI(uri);
            URI allowedUri = new URI(allowedHost);
            return parsedUri.getHost().equalsIgnoreCase(allowedUri.getHost());
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Checks if a string contains control characters that could be used for CRLF injection.
     */
    private boolean containsControlCharacters(String input) {
        for (char c : input.toCharArray()) {
            if (c < 32 && c != '\t') { // Allow tabs, but block other control chars including CR and LF
                return true;
            }
        }
        return false;
    }
}
