package org.pucar.dristi.util;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.List;


@Component
@Slf4j
public class FileStoreUtil {
    private Configuration configs;
    private RestTemplate restTemplate;
    @Autowired
    public FileStoreUtil(RestTemplate restTemplate, Configuration configs) {
        this.restTemplate = restTemplate;
        this.configs = configs;
    }
    public ResponseEntity<Resource> getFilesByFileStore(String fileStoreId, String tenantId, String moduleName) {
        if (fileStoreId == null || fileStoreId.isEmpty()) {
            log.warn("No file store IDs provided");
            throw new CustomException("INVALID_FILE_STORE_ID", "File store ID cannot be null or empty");
        }
        String url = configs.getFileStoreHost() + configs.getFileStoreGetEndPoint() + "?tenantId=" + tenantId + "&fileStoreId="+fileStoreId;
        if (moduleName != null && !moduleName.isEmpty()) {
            final String SIGNED_SUFFIX = ",signed"; // consider moving to a constant or config
            if (moduleName.contains(SIGNED_SUFFIX.replace(",", ""))) {
                log.warn("Module name already contains ‘signed’: {}", moduleName);
            }
            url += "&module=" + moduleName + SIGNED_SUFFIX;
        }
        try {
            return restTemplate.getForEntity(url, Resource.class);
        } catch (CustomException e) {
            log.error("Error while fetching files from file store: {}", e.getMessage(), e);
            throw new CustomException("FILE_STORE_UTILITY_EXCEPTION", "Error occurred when fetching files from File Store");
        }
    }
}
