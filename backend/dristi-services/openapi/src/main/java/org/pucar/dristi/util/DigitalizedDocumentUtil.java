package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.digital_document.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component
@Slf4j
public class DigitalizedDocumentUtil {

    private final Configuration configuration;

    private final RestTemplate restTemplate;

    private final ObjectMapper mapper;

    @Autowired
    public DigitalizedDocumentUtil(Configuration configuration, RestTemplate restTemplate, ObjectMapper mapper) {
        this.configuration = configuration;
        this.restTemplate = restTemplate;
        this.mapper = mapper;
    }

    public DigitalizedDocumentSearchResponse searchDigitalizeDoc(DigitalizedDocumentSearchCriteria criteria, RequestInfo requestInfo) {

        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getDigitalizeServiceHost()).append(configuration.getDigitalizeServiceSearchEndpoint());

        DigitalizedDocumentSearchRequest digitalizedDocumentSearchRequest = DigitalizedDocumentSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(criteria)
                .build();

        Object response;
        DigitalizedDocumentSearchResponse digitalizedDocumentSearchResponse;
        try {
            response = restTemplate.postForObject(uri.toString(), digitalizedDocumentSearchRequest, Map.class);
            digitalizedDocumentSearchResponse = mapper.convertValue(response, DigitalizedDocumentSearchResponse.class);
            log.info("Evidence response :: {}", digitalizedDocumentSearchResponse);
            return digitalizedDocumentSearchResponse;
        } catch (Exception e) {
            log.error("Error while searching for evidence", e);
            throw new CustomException("EVIDENCE_SERVICE_ERROR", e.getMessage());
        }
    }

    public DigitalizedDocumentResponse updateDigitalizeDoc(DigitalizedDocument digitalizedDocument, RequestInfo requestInfo) {

        StringBuilder uri = new StringBuilder();
        uri.append(configuration.getDigitalizeServiceHost()).append(configuration.getDigitalizeServiceUpdateEndpoint());

        DigitalizedDocumentRequest digitalizedDocumentRequest = DigitalizedDocumentRequest.builder()
                .requestInfo(requestInfo)
                .digitalizedDocument(digitalizedDocument)
                .build();

        Object response;
        try {
            response = restTemplate.postForObject(uri.toString(), digitalizedDocumentRequest, Map.class);
            return mapper.convertValue(response, DigitalizedDocumentResponse.class);
        } catch (Exception e) {
            log.error("Error while updating evidence", e);
            throw new CustomException("EVIDENCE_SERVICE_ERROR", e.getMessage());
        }
    }
}