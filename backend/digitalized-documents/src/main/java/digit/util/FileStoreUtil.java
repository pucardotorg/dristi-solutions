package digit.util;

import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

import static digit.config.ServiceConstants.FILE;
import static digit.config.ServiceConstants.FILE_STORE_SERVICE_EXCEPTION_CODE;
import static digit.config.ServiceConstants.INVALID_INPUT;


@Component
@Slf4j
public class FileStoreUtil {
    private final Configuration configs;
    private final RestTemplate restTemplate;
    private final ServiceRequestRepository repository;
    @Autowired
    public FileStoreUtil(RestTemplate restTemplate, Configuration configs, ServiceRequestRepository repository) {
        this.restTemplate = restTemplate;
        this.configs = configs;
        this.repository = repository;
    }
    public void deleteFilesByFileStore(List<String> fileStoreIds, String tenantId) {
        if (fileStoreIds == null || fileStoreIds.isEmpty()) {
            log.warn("No file store IDs provided for deletion");
            return;
        }
        String url = configs.getFileStoreHost() + configs.getFileStoreDeleteEndPoint() + "?tenantId=" + tenantId;

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("fileStoreIds", String.join(",", fileStoreIds));
        body.add("isSoftDelete", false);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, new HttpHeaders());
        Object response = null;
        try {
            ResponseEntity<Object> responseEntity = restTemplate.postForEntity(url, requestEntity, Object.class);
            log.info("Files deleted from filestore: {}, status: {}", fileStoreIds, responseEntity.getStatusCode());
        } catch (CustomException e) {
            log.error("Error while deleting files from file store: {}", e.getMessage(), e);
            throw new CustomException("FILE_STORE_UTILITY_EXCEPTION", "Error occurred when deleting files in File Store");
        }
    }

    public Resource fetchFileStoreObjectById(String fileStoreId, String tenantId) {
        log.info("Fetching file store object by id: {}", fileStoreId);
        if (!isValidFileStoreId(fileStoreId) || !isValidTenantId(tenantId)) {
            throw new CustomException(INVALID_INPUT, "Invalid fileStoreId or tenantId");
        }
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getFileStoreHost()).append(configs.getFileStoreSearchEndpoint());
        uri = appendQueryParams(uri, "fileStoreId", fileStoreId, "tenantId", tenantId);
        Resource object;
        try {
            object = repository.fetchResultGetForResource(uri);
            log.info("Successfully fetched file store object by id: {}", fileStoreId);
            return object;

        } catch (Exception e) {
            throw new CustomException(FILE_STORE_SERVICE_EXCEPTION_CODE, e.getMessage());

        }

    }

    private boolean isValidFileStoreId(String fileStoreId) {
        return fileStoreId != null && fileStoreId.matches("[a-zA-Z0-9_-]+");
    }

    private boolean isValidTenantId(String tenantId) {
        return tenantId != null && tenantId.matches("[a-zA-Z0-9_-]+");
    }

    public StringBuilder appendQueryParams(StringBuilder uri, String paramName1, String paramValue1, String paramName2, String paramValue2) {
        if (uri.indexOf("?") == -1) {
            uri.append("?");
        } else {
            uri.append("&");
        }
        uri.append(paramName1).append("=").append(paramValue1).append("&");
        uri.append(paramName2).append("=").append(paramValue2);
        return uri;
    }

    public String storeFileInFileStore(MultipartFile file, String tenantId) {

        if (!FileValidationUtil.isValidFile(file)) {
            throw new IllegalArgumentException("Invalid file type");
        }
        String module = "signed";  // fixme: take me from constant file
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getFileStoreHost()).append(configs.getFileStoreSaveEndPoint());

        MultiValueMap<String, Object> request = new LinkedMultiValueMap<>();
        request.add(FILE, file.getResource());
        request.add("tenantId", tenantId);
        request.add("module", module);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>(request, headers);


        ResponseEntity<String> response = restTemplate.exchange(uri.toString(), HttpMethod.POST, entity, String.class);
        String body = response.getBody();
        JSONObject jsonObject = new JSONObject(body);
        JSONObject fileObject = jsonObject.getJSONArray("files").getJSONObject(0);
        return fileObject.getString("fileStoreId");


    }
}
