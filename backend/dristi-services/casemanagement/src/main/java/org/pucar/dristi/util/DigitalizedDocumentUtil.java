package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.digitalizeddocument.DigitalizedDocument;
import org.pucar.dristi.web.models.digitalizeddocument.DigitalizedDocumentSearchCriteria;
import org.pucar.dristi.web.models.digitalizeddocument.DigitalizedDocumentSearchRequest;
import org.pucar.dristi.web.models.digitalizeddocument.DigitalizedDocumentSearchResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

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
    public List<DigitalizedDocument> searchDigitalizedDocuments(String caseId, String courtId) {
        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getDigitalizedDocumentsHost())
           .append(configuration.getDigitalizedDocumentsSearchEndPoint());

        DigitalizedDocumentSearchRequest searchRequest = DigitalizedDocumentSearchRequest.builder().criteria(DigitalizedDocumentSearchCriteria.builder().caseId(caseId).courtId(courtId).status("COMPLETED").build()).build();
        try {
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
}
