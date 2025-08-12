package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Document;
import org.json.JSONArray;
import org.json.JSONObject;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.web.models.Advocate;
import org.pucar.dristi.web.models.Comment;
import org.pucar.dristi.web.models.OpenArtifact;
import org.pucar.dristi.web.models.WorkflowObject;
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

import static org.pucar.dristi.config.ServiceConstants.*;

@Component
@Slf4j
public class EsUtil {

    private final RestTemplate restTemplate;
    private final Configuration config;
    private final ObjectMapper mapper;

    @Autowired
    public EsUtil(RestTemplate restTemplate, Configuration config, ObjectMapper mapper) {
        this.restTemplate = restTemplate;
        this.config = config;
        this.mapper=mapper;
    }

    public String buildPayload(OpenArtifact openArtifact) {
        // Extract fields
        String id = openArtifact.getId() != null ? openArtifact.getId().toString() : null;
        String tenantId = openArtifact.getTenantId();
        String artifactNumber = openArtifact.getArtifactNumber();
        String evidenceNumber = openArtifact.getEvidenceNumber();
        String filingNumber = openArtifact.getFilingNumber();
        String externalRefNumber = openArtifact.getExternalRefNumber();
        String courtId = openArtifact.getCourtId();
        String caseId = openArtifact.getCaseId();
        String caseNumber = openArtifact.getCaseNumber();
        String caseTitle = openArtifact.getCaseTitle();
        Advocate advocate = openArtifact.getAdvocate();
        String advocateString = advocate != null ? new JSONObject(advocate).toString() : null;
        String application = openArtifact.getApplication();
        String hearing = openArtifact.getHearing();
        String order = openArtifact.getOrder();
        String cnrNumber = openArtifact.getCnrNumber();
        String mediaType = openArtifact.getMediaType();
        String artifactType = openArtifact.getArtifactType();
        String sourceType = openArtifact.getSourceType();
        String sourceID = openArtifact.getSourceID();
        String sourceName = openArtifact.getSourceName();
        List<String> applicableTo = openArtifact.getApplicableTo();
        String applicableToString = applicableTo != null ? new JSONArray(applicableTo).toString() : null;
        Long createdDate = openArtifact.getCreatedDate() != null ? openArtifact.getCreatedDate() : 0L;
        Long publishedDate = openArtifact.getPublishedDate() != null ? openArtifact.getPublishedDate() : 0L;
        Boolean isActive = openArtifact.getIsActive();
        Boolean isEvidence = openArtifact.getIsEvidence();
        String status = openArtifact.getStatus();
        String filingType = openArtifact.getFilingType();
        Boolean isVoid = openArtifact.getIsVoid();
        String reason = openArtifact.getReason();
        Document file = openArtifact.getFile();
        String fileString = file != null ? new JSONObject(file).toString() : null;
        Document seal = openArtifact.getSeal();
        String sealString = seal != null ? new JSONObject(seal).toString() : null;
        String description = openArtifact.getDescription();
        Object artifactDetails = openArtifact.getArtifactDetails();
        String artifactDetailsString = artifactDetails != null ? new JSONObject(artifactDetails).toString() : null;
        List<String> searchableFields = openArtifact.getSearchableFields();
        String searchableFieldsString = searchableFields != null ? new JSONArray(searchableFields).toString() : null;
        List<Comment> comments = openArtifact.getComments();
        String commentsString = comments != null ? new JSONArray(comments).toString() : null;
        Object additionalDetails = openArtifact.getAdditionalDetails();
        String additionalDetailsString = additionalDetails != null ? new JSONObject(additionalDetails).toString() : null;
        AuditDetails auditDetails = openArtifact.getAuditdetails();
        String auditDetailsString = auditDetails != null ? new JSONObject(auditDetails).toString() : null;
        WorkflowObject workflow = openArtifact.getWorkflow();
        String workflowString = workflow != null ? new JSONObject(workflow).toString() : null;
        String evidenceMarkedStatus = openArtifact.getEvidenceMarkedStatus();
        Boolean isEvidenceMarkedFlow = openArtifact.getIsEvidenceMarkedFlow();
        String tag = openArtifact.getTag();
        String shortenedUrl = openArtifact.getShortenedUrl();
        List<String> witnessMobileNumbers = openArtifact.getWitnessMobileNumbers();
        String witnessMobileNumbersString = witnessMobileNumbers != null ? new JSONArray(witnessMobileNumbers).toString() : null;
        List<String> witnessEmails = openArtifact.getWitnessEmails();
        String witnessEmailsString = witnessEmails != null ? new JSONArray(witnessEmails).toString() : null;

        return String.format(
                ES_INDEX_HEADER_FORMAT + ES_INDEX_DOCUMENT_FORMAT,
                config.getOpenArtifactIndex(), artifactNumber,
                id, tenantId, artifactNumber, evidenceNumber, filingNumber, externalRefNumber, courtId, caseId,
                caseNumber, caseTitle, advocateString, application, hearing, order, cnrNumber, mediaType, artifactType,
                sourceType, sourceID, sourceName, applicableToString, createdDate, publishedDate, isActive, isEvidence,
                status, filingType, isVoid, reason, fileString, sealString, description, artifactDetailsString,
                searchableFieldsString, commentsString, additionalDetailsString, auditDetailsString, workflowString,
                evidenceMarkedStatus, isEvidenceMarkedFlow, tag, shortenedUrl, witnessMobileNumbersString, witnessEmailsString
        );
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