package digit.util;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.Document;
import org.egov.tracer.model.CustomException;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

import static digit.config.ServiceConstants.*;

import java.util.Set;



@Component
@Slf4j
public class FileStoreUtil {

    private static final String FILE_STORE_ID_KEY = "fileStoreId";
    private static final String FILES_KEY = "files";
    private static final String DOCUMENT_TYPE_PDF = "application/pdf";

    private Configuration configs;

    private RestTemplate restTemplate;

    private final ServiceRequestRepository repository;

    private final ObjectMapper mapper;

    @Autowired
    public FileStoreUtil(RestTemplate restTemplate, Configuration configs, ServiceRequestRepository repository, ObjectMapper mapper) {
        this.restTemplate = restTemplate;
        this.configs = configs;
        this.repository = repository;
        this.mapper = mapper;
    }

    /**
     * Returns whether the file exists or not in the filestore.
     * @param tenantId
     * @param fileStoreId
     * @return
     */
    public boolean doesFileExist(String tenantId,  String fileStoreId) {
        boolean fileExists = false;
        try{
            StringBuilder uri = new StringBuilder(configs.getFileStoreHost()).append(configs.getFileStorePath());
            uri.append("tenantId=").append(tenantId).append("&").append("fileStoreId=").append(fileStoreId);
            ResponseEntity<String> responseEntity= restTemplate.getForEntity(uri.toString(), String.class);
            fileExists = responseEntity.getStatusCode().equals(HttpStatus.OK);
        }catch (Exception e){
            log.error("Document {} is not found in the Filestore for tenantId {} ! An exception occurred!",
                    fileStoreId,
                    tenantId,
                    e);
        }
        return fileExists;
    }
    public void deleteFilesByFileStore(Set<String> fileStoreIds, String tenantId) {

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

    private Document extractDocumentFromResponse(ResponseEntity<Object> responseEntity) {
        JsonNode rootNode = mapper.convertValue(responseEntity.getBody(), JsonNode.class);
        if (rootNode.has(FILES_KEY) && rootNode.get(FILES_KEY).isArray() && rootNode.get(FILES_KEY).get(0).isObject()) {
            Document document = new Document();
            document.setFileStore(rootNode.get(FILES_KEY).get(0).get(FILE_STORE_ID_KEY).asText());
            document.setDocumentType(DOCUMENT_TYPE_PDF);
            log.info("File Store Details: {}", document);
            return document;
        } else {
            log.error(FILE_STORE_SERVICE_EXCEPTION_MESSAGE_CODE);
            throw new CustomException(INVALID_FILE_STORE_RESPONSE, FILE_STORE_SERVICE_EXCEPTION_MESSAGE_CODE);
        }
    }


    public Resource fetchFileStoreObjectById(String fileStoreId, String tenantId) {
        if (!isValidFileStoreId(fileStoreId) || !isValidTenantId(tenantId)) {
            throw new CustomException(INVALID_INPUT, "Invalid fileStoreId or tenantId");
        }
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getFileStoreHost()).append(configs.getFileStoreSearchEndpoint());
        uri = appendQueryParams(uri, "fileStoreId", fileStoreId, "tenantId", tenantId);
        Resource object;
        try {
            object = repository.fetchResultGetForResource(uri);
            return object;

        } catch (Exception e) {
            throw new CustomException(FILE_STORE_SERVICE_EXCEPTION_CODE, FILE_STORE_SERVICE_EXCEPTION_MESSAGE);

        }

    }

    private boolean isValidFileStoreId(String fileStoreId) {
        return fileStoreId != null && fileStoreId.matches("[a-zA-Z0-9_-]+");
    }

    private boolean isValidTenantId(String tenantId) {
        return tenantId != null && tenantId.matches("[a-zA-Z0-9_-]+");
    }


    public String storeFileInFileStore(MultipartFile file, String tenantId) {

        if (!FileValidationUtil.isValidFile(file)) {
            throw new IllegalArgumentException("Invalid file type");
        }
        String module = "signed";  // fixme: take me from constant file
        StringBuilder uri = new StringBuilder();
        uri.append(configs.getFileStoreHost()).append(configs.getFileStoreSaveEndPoint());

        List<MultipartFile> files = new ArrayList<>();
        files.add(file);

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
}
