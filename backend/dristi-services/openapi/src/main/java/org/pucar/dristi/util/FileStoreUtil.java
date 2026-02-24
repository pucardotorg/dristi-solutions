package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.filestore.StorageResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

import static org.pucar.dristi.config.ServiceConstants.FILE_UPLOAD_ERROR;


@Component
@Slf4j
public class FileStoreUtil {
    private Configuration configs;
    private RestTemplate restTemplate;

    private final ObjectMapper objectMapper;
    @Autowired
    public FileStoreUtil(RestTemplate restTemplate, Configuration configs, ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.configs = configs;
        this.objectMapper = objectMapper;
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

    public StorageResponse uploadFiles(List<MultipartFile> files, String tenantId, String module, String tag, RequestInfo requestInfo) {
        try {
            String url = configs.getFileStoreHost() + configs.getFileStoreSaveEndPoint();

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();

            // Convert each MultipartFile to a Resource
            for (MultipartFile file : files) {
                body.add("file", new MultipartInputStreamFileResource(
                        file.getInputStream(),
                        file.getOriginalFilename(),
                        file.getSize()
                ));
            }

            body.add("tenantId", tenantId);
            body.add("module", module);

            if (tag != null && !tag.isEmpty()) {
                body.add("tag", tag);
            }

            body.add("requestInfo", objectMapper.writeValueAsString(requestInfo));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<StorageResponse> response = restTemplate.postForEntity(url, requestEntity, StorageResponse.class);

            return response.getBody();

        } catch (Exception e) {
            log.error("Error while uploading files to File Store", e);
            throw new CustomException(FILE_UPLOAD_ERROR, "Error occurred while uploading file to File Store");
        }
    }

}
