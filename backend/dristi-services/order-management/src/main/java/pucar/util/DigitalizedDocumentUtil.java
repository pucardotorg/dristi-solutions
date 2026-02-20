package pucar.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import pucar.config.Configuration;
import pucar.web.models.digitalizeddocument.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class DigitalizedDocumentUtil {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final Configuration configuration;

    @Autowired
    public DigitalizedDocumentUtil(RestTemplate restTemplate, ObjectMapper objectMapper, Configuration configuration) {
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        this.configuration = configuration;
    }

    /**
     * Searches for digitalized documents based on criteria
     */
    public List<DigitalizedDocument> searchDigitalizedDocuments(DigitalizedDocumentSearchRequest searchRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getDigitalizedDocumentsHost())
           .append(configuration.getDigitalizedDocumentsSearchEndPoint());

        try {
            log.info("Searching digitalized documents with criteria: {}", searchRequest.getCriteria());
            Object response = restTemplate.postForObject(uri.toString(), searchRequest, Map.class);
            JsonNode jsonNode = objectMapper.readTree(objectMapper.writeValueAsString(response));
            DigitalizedDocumentSearchResponse searchResponse = objectMapper.convertValue(jsonNode, DigitalizedDocumentSearchResponse.class);
            
            if (searchResponse != null && searchResponse.getDocuments() != null) {
                log.info("Found {} digitalized documents", searchResponse.getDocuments().size());
                return searchResponse.getDocuments();
            }
            return new ArrayList<>();
        } catch (Exception e) {
            log.error("Error while searching digitalized documents", e);
            throw new CustomException("DIGITALIZED_DOCUMENT_SEARCH_ERROR", e.getMessage());
        }
    }

    /**
     * Creates a new digitalized document
     */
    public DigitalizedDocument createDigitalizedDocument(DigitalizedDocumentRequest request) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getDigitalizedDocumentsHost())
           .append(configuration.getDigitalizedDocumentsCreateEndPoint());

        try {
            log.info("Creating digitalized document: {}", request.getDigitalizedDocument());
            Object response = restTemplate.postForObject(uri.toString(), request, Map.class);
            JsonNode jsonNode = objectMapper.readTree(objectMapper.writeValueAsString(response));
            DigitalizedDocumentResponse documentResponse = objectMapper.convertValue(jsonNode, DigitalizedDocumentResponse.class);
            
            if (documentResponse != null && documentResponse.getDigitalizedDocument() != null) {
                log.info("Created digitalized document with id: {}", documentResponse.getDigitalizedDocument().getId());
                return documentResponse.getDigitalizedDocument();
            }
            throw new CustomException("DIGITALIZED_DOCUMENT_CREATE_ERROR", "Failed to create digitalized document");
        } catch (Exception e) {
            log.error("Error while creating digitalized document", e);
            throw new CustomException("DIGITALIZED_DOCUMENT_CREATE_ERROR", e.getMessage());
        }
    }

    /**
     * Updates an existing digitalized document
     */
    public DigitalizedDocument updateDigitalizedDocument(DigitalizedDocumentRequest request) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getDigitalizedDocumentsHost())
           .append(configuration.getDigitalizedDocumentsUpdateEndPoint());

        try {
            log.info("Updating digitalized document with id: {}", request.getDigitalizedDocument().getId());
            Object response = restTemplate.postForObject(uri.toString(), request, Map.class);
            JsonNode jsonNode = objectMapper.readTree(objectMapper.writeValueAsString(response));
            DigitalizedDocumentResponse documentResponse = objectMapper.convertValue(jsonNode, DigitalizedDocumentResponse.class);
            
            if (documentResponse != null && documentResponse.getDigitalizedDocument() != null) {
                log.info("Updated digitalized document with id: {}", documentResponse.getDigitalizedDocument().getId());
                return documentResponse.getDigitalizedDocument();
            }
            throw new CustomException("DIGITALIZED_DOCUMENT_UPDATE_ERROR", "Failed to update digitalized document");
        } catch (Exception e) {
            log.error("Error while updating digitalized document", e);
            throw new CustomException("DIGITALIZED_DOCUMENT_UPDATE_ERROR", e.getMessage());
        }
    }
}
