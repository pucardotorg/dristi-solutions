package com.dristi.njdg_transformer.utils;

import com.dristi.njdg_transformer.config.TransformerProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
public class FileStoreUtil {

    private final TransformerProperties configs;
    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;
    private final UrlValidator urlValidator;

    @Autowired
    public FileStoreUtil(RestTemplate restTemplate, TransformerProperties configs, ObjectMapper mapper, UrlValidator urlValidator) {
        this.restTemplate = restTemplate;
        this.configs = configs;
        this.mapper = mapper;
        this.urlValidator = urlValidator;
    }

    /**
     * Fetches the file resource from the FileStore service.
     *
     * @param tenantId    Tenant identifier
     * @param fileStoreId FileStore identifier
     * @return Resource fetched from FileStore (can be written or processed)
     */
    public Resource getFileStore(RequestInfo requestInfo, String tenantId, String fileStoreId) {
        try {
            // Validate user inputs (sanitization)
            String validatedTenantId = urlValidator.validateTenantId(tenantId);
            String validatedFileStoreId = urlValidator.validateIdentifier(fileStoreId, "FILE_STORE_ID");
            
            // SSRF Protection: Build URI using ONLY trusted configuration for host/path
            // User input is restricted to query parameters only (not host/path)
            String trustedBaseUrl = configs.getFileStoreHost(); // From application config
            String trustedPath = configs.getFileStorePath();     // From application config
            
            // Construct URI with trusted base, user input only in query params
            URI targetUri = UriComponentsBuilder
                    .fromUriString(trustedBaseUrl)
                    .path(trustedPath)
                    .queryParam("tenantId", validatedTenantId)
                    .queryParam("fileStoreId", validatedFileStoreId)
                    .build()
                    .encode()
                    .toUri();

            // Prepare RequestInfo JSON
            Map<String, Object> requestInfoWrapper = new HashMap<>();
            requestInfoWrapper.put("RequestInfo", requestInfo);
            String requestBody = mapper.writeValueAsString(requestInfoWrapper);

            // Prepare headers
            HttpHeaders headers = new HttpHeaders();
            headers.setAccept(MediaType.parseMediaTypes("*/*"));
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

            // Make request to trusted FileStore service
            ResponseEntity<Resource> response = restTemplate.exchange(
                    targetUri, HttpMethod.GET, entity, Resource.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                log.info("Successfully fetched file {} for tenant {}", fileStoreId, tenantId);
                return response.getBody();
            } else {
                log.warn("File not found in FileStore: {}", fileStoreId);
            }

        } catch (Exception e) {
            log.error("Error fetching file {} for tenant {} from FileStore: ", fileStoreId, tenantId, e);
        }

        return null;
    }
}
