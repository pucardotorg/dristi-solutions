package org.egov.transformer.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.egov.transformer.config.TransformerProperties;
import org.egov.transformer.models.Artifact;
import org.egov.transformer.models.BailUpdateRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

import static org.egov.transformer.config.ServiceConstants.*;


@Component
@Slf4j
public class EsUtil {

    private final RestTemplate restTemplate;
    private final TransformerProperties config;
    private final ObjectMapper mapper;

    @Autowired
    public EsUtil(RestTemplate restTemplate, TransformerProperties config, ObjectMapper mapper) {
        this.restTemplate = restTemplate;
        this.config = config;
        this.mapper=mapper;
    }

    // Builds the ES update payload for a single Bail record
    public String buildPayload(BailUpdateRequest request) {
        try {
            List<String> searchableFields = new ArrayList<>();

            if (StringUtils.hasText(request.getFilingNumber())) {
                searchableFields.add(request.getFilingNumber());
            }
            if (StringUtils.hasText(request.getCmpNumber())) {
                searchableFields.add(request.getCmpNumber());
            }
            if (StringUtils.hasText(request.getCourtCaseNumber())) {
                searchableFields.add(request.getCourtCaseNumber());
            }
            if (StringUtils.hasText(request.getCaseTitle())) {
                searchableFields.add(request.getCaseTitle());
            }

            String searchableFieldsJson = mapper.writeValueAsString(searchableFields);

            return String.format(
                    ES_UPDATE_BAIL_HEADER_FORMAT + ES_UPDATE_BAIL_DOCUMENT_FORMAT,
                    config.getBailBondIndex(),
                    request.getBailUuid(),
                    request.getCaseNumber(),
                    searchableFieldsJson
            );
        } catch (Exception e) {
            log.error("Failed to build payload for bailUuid: {}", request.getBailUuid(), e);
            return "";
        }
    }

    public String buildArtifactPayload(Artifact artifact) {
        try {
            List<String> searchableFields = new ArrayList<>();
            if (StringUtils.hasText(artifact.getCaseTitle())) {
                searchableFields.add(artifact.getCaseTitle());
            }
            if (StringUtils.hasText(artifact.getCaseNumber())) {
                searchableFields.add(artifact.getCaseNumber());
            }
            if (StringUtils.hasText(artifact.getArtifactNumber())) {
                searchableFields.add(artifact.getArtifactNumber());
            }

            String searchableFieldsJson = mapper.writeValueAsString(searchableFields);

            return String.format(
                    ES_UPDATE_ARTIFACT_HEADER_FORMAT + ES_UPDATE_ARTIFACT_DOCUMENT_FORMAT,
                    config.getOpenArtifactIndex(),
                    artifact.getArtifactNumber(),
                    artifact.getCaseNumber(),
                    searchableFieldsJson
            );
        } catch (Exception e) {
            log.error("Failed to build payload for artifactNumber: {}", artifact.getArtifactNumber(), e);
            return "";
        }
    }



    // Bulk update method for multiple Bail records
    public void updateBailCaseNumbers(List<BailUpdateRequest> bailUpdates) {
        try {
            if (bailUpdates != null && !bailUpdates.isEmpty()) {
                String bulkRequestPayload = bailUpdates.stream()
                        .map(this::buildPayload)
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.joining());
                String uri = config.getEsHostUrl() + config.getBulkPath();
                manualIndex(uri, bulkRequestPayload);
            }
        } catch (Exception e) {
            log.error("Error occurred while updating caseNumber in bail index", e);
        }
    }

    public void updateArtifactCaseNumbers(List<Artifact> artifactList) {
        try {
            if (artifactList != null && !artifactList.isEmpty()) {
                String bulkPayload = artifactList.stream()
                        .map(this::buildArtifactPayload)
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.joining());

                String uri = config.getEsHostUrl() + config.getBulkPath();
                manualIndex(uri, bulkPayload);
            }
        } catch (Exception e) {
            log.error("Error occurred while updating caseNumber in artifact index", e);
        }
    }



    public void manualIndex(String uri, String request) throws Exception {
        try {
            log.debug("Record being indexed manually: {}", request);

            final HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON_UTF8);
            headers.add("Authorization", getESEncodedCredentials());
            final HttpEntity<String> entity = new HttpEntity<>(request, headers);

            String response = restTemplate.postForObject(uri, entity, String.class);
            if (uri.contains("_bulk") && JsonPath.read(response, ERRORS_PATH).equals(true)) {
                log.info("Manual Indexing FAILED!!!!");
                log.info("Response from ES for manual push: {}", response);
                throw new Exception("Error while updating index");
            }
        } catch (Exception e) {
            log.error("Exception while trying to index the ES documents", e);
            throw e;
        }
    }

    public String getESEncodedCredentials() {
        String credentials = config.getEsUsername() + ":" + config.getEsPassword();
        byte[] credentialsBytes = credentials.getBytes();
        byte[] base64CredentialsBytes = Base64.getEncoder().encode(credentialsBytes);
        return "Basic " + new String(base64CredentialsBytes);
    }
}
