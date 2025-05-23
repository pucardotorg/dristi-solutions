package digit.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.Document;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.List;

import static digit.config.ServiceConstants.FILE_STORE_UTILITY_EXCEPTION;

@Component
@Slf4j
public class FileStoreUtil {

    private static final String FILE_STORE_ID_KEY = "fileStoreId";
    private static final String FILES_KEY = "files";
    private static final String DOCUMENT_TYPE_PDF = "application/pdf";

    private Configuration configs;

    private RestTemplate restTemplate;

    private final ObjectMapper mapper;

    @Autowired
    public FileStoreUtil(RestTemplate restTemplate, Configuration configs, ObjectMapper mapper) {
        this.restTemplate = restTemplate;
        this.configs = configs;
        this.mapper = mapper;
    }

    public byte[] getFile(String tenantId,  String fileStoreId) {
        byte[] pdfBytes = null;
        try{
            StringBuilder uri = new StringBuilder(configs.getFileStoreHost()).append(configs.getFileStorePath());
            uri.append("tenantId=").append(tenantId).append("&").append("fileStoreId=").append(fileStoreId);
            ResponseEntity<Resource> responseEntity= restTemplate.getForEntity(uri.toString(), Resource.class);
            return responseEntity.getBody().getContentAsByteArray();
        }catch (Exception e){
            log.error("Document {} is not found in the Filestore for tenantId {} ! An exception occurred!",
                    fileStoreId,
                    tenantId,
                    e);
        }
        return pdfBytes;
    }

    public Document saveDocumentToFileStore(ByteArrayResource byteArrayResource, String tenantId) {

        try {
            String uri = buildFileStoreUri(tenantId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", byteArrayResource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<Object> responseEntity = restTemplate.postForEntity(uri, requestEntity, Object.class);

            return extractDocumentFromResponse(responseEntity);
        } catch (Exception e) {
            log.error("Error while saving document to file store: {}", e.getMessage(), e);
            throw new CustomException(FILE_STORE_UTILITY_EXCEPTION, "Error occurred when getting saving document in File Store");
        }
    }

    private String buildFileStoreUri(String tenantId) {
        return configs.getFileStoreHost() +
                configs.getFileStoreSaveEndPoint() +
                "?tenantId=" + tenantId +
                "&module=" + configs.getFileStoreCaseDiaryModule();
    }

    public Document extractDocumentFromResponse(ResponseEntity<Object> responseEntity) {
        JsonNode rootNode = mapper.convertValue(responseEntity.getBody(), JsonNode.class);
        if (rootNode.has(FILES_KEY) && rootNode.get(FILES_KEY).isArray() && rootNode.get(FILES_KEY).get(0).isObject()) {
            Document document = new Document();
            document.setFileStore(rootNode.get(FILES_KEY).get(0).get(FILE_STORE_ID_KEY).asText());
            document.setDocumentType(DOCUMENT_TYPE_PDF);
            log.info("File Store Details: {}", document);
            return document;
        } else {
            log.error("Failed to get valid file store id from File Store Service Response");
            throw new CustomException("INVALID_FILE_STORE_RESPONSE", "Failed to get valid file store id from file store service");
        }
    }

    public void deleteFilesByFileStore(List<String> fileStoreIds, String tenantId) {
        if (fileStoreIds == null || fileStoreIds.isEmpty()) {
            log.warn("No file store IDs provided for deletion");
            return;
        }
        String url = configs.getFileStoreHost() + configs.getFileStoreDeleteEndPoint() + "?tenantId=" + tenantId;

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("fileStoreIds", fileStoreIds);
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
}

