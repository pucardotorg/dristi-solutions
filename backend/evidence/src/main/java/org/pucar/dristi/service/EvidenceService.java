package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Document;
import org.egov.common.contract.models.Workflow;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.enrichment.EvidenceEnrichment;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.EvidenceRepository;
import org.pucar.dristi.util.*;
import org.pucar.dristi.validators.EvidenceValidator;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

import static org.pucar.dristi.config.ServiceConstants.*;

@Slf4j
@Service
public class EvidenceService {
    private final EvidenceValidator validator;
    private final EvidenceEnrichment evidenceEnrichment;
    private final WorkflowService workflowService;
    private final EvidenceRepository repository;
    private final Producer producer;
    private final Configuration config;
    private final MdmsUtil mdmsUtil;
    private final ObjectMapper objectMapper;
    private final CaseUtil caseUtil;
    private final SmsNotificationService notificationService;
    private final IndividualService individualService;
    private final UrlShortenerUtil urlShortenerUtil;
    private final ESignUtil eSignUtil;
    private final FileStoreUtil fileStoreUtil;
    private final CipherUtil cipherUtil;
    private final XmlRequestGenerator xmlRequestGenerator;

    @Autowired
    public EvidenceService(EvidenceValidator validator, EvidenceEnrichment evidenceEnrichment, WorkflowService workflowService, EvidenceRepository repository, Producer producer, Configuration config, MdmsUtil mdmsUtil, CaseUtil caseUtil, ObjectMapper objectMapper, SmsNotificationService notificationService, IndividualService individualService, UrlShortenerUtil urlShortenerUtil, ESignUtil eSignUtil, FileStoreUtil fileStoreUtil, CipherUtil cipherUtil, XmlRequestGenerator xmlRequestGenerator) {
        this.validator = validator;
        this.evidenceEnrichment = evidenceEnrichment;
        this.workflowService = workflowService;
        this.repository = repository;
        this.producer = producer;
        this.config = config;
        this.mdmsUtil = mdmsUtil;
        this.objectMapper = objectMapper;
        this.caseUtil = caseUtil;
        this.notificationService = notificationService;
        this.individualService = individualService;
        this.urlShortenerUtil = urlShortenerUtil;
        this.eSignUtil = eSignUtil;
        this.fileStoreUtil = fileStoreUtil;
        this.cipherUtil = cipherUtil;
        this.xmlRequestGenerator = xmlRequestGenerator;
    }

    public Artifact createEvidence(EvidenceRequest body) {
        try {

            // Validate applications
            validator.validateEvidenceRegistration(body);

            String filingType = getFilingTypeMdms(body.getRequestInfo(), body.getArtifact());

            // Enrich applications
            evidenceEnrichment.enrichEvidenceRegistration(body);
            if (body.getArtifact().getIsEvidence().equals(true)) {
                evidenceEnrichment.enrichEvidenceNumber(body);
            }


            // Initiate workflow for the new application- //todo witness deposition is part of case filing or not
            if ((body.getArtifact().getArtifactType() != null &&
                    body.getArtifact().getArtifactType().equals(DEPOSITION)) ||
                    (filingType != null && body.getArtifact().getWorkflow() != null && filingType.equalsIgnoreCase(SUBMISSION))) {
                workflowService.updateWorkflowStatus(body, filingType);
                producer.push(config.getEvidenceCreateTopic(), body);
            } else {
                producer.push(config.getEvidenceCreateWithoutWorkflowTopic(), body);
            }
            callNotificationService(body,false,true);
            return body.getArtifact();
        } catch (CustomException e) {
            log.error("Custom Exception occurred while creating evidence");
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while creating evidence");
            throw new CustomException(EVIDENCE_CREATE_EXCEPTION, e.toString());
        }
    }

    private String getFilingTypeMdms(RequestInfo requestInfo, Artifact artifact) {
         try{
             Map<String, Map<String, JSONArray>> mdmsData = mdmsUtil.fetchMdmsData(requestInfo, artifact.getTenantId(), config.getFilingTypeModule(), Collections.singletonList(config.getFilingTypeMaster()));
             JSONArray jsonArray = mdmsData.get(config.getFilingTypeModule()).get(config.getFilingTypeMaster());
             String filingType = null;
             for(Object obj : jsonArray) {
                 JSONObject jsonObject = objectMapper.convertValue(obj, JSONObject.class);
                 if(jsonObject.get("code").equals(artifact.getFilingType())) {
                     filingType = jsonObject.get("code").toString();
                 }
             }
             if(filingType == null) {
                 throw new CustomException(MDMS_DATA_NOT_FOUND, "Filing type not found in mdms");
             }
             return filingType;
         } catch (Exception e){
                log.error("Error fetching filing type from mdms: {}", e.toString());
                throw new CustomException("MDMS_FETCH_ERR", "Error fetching filing type from mdms: " + e.toString());
         }
    }

    public List<Artifact> searchEvidence(RequestInfo requestInfo, EvidenceSearchCriteria evidenceSearchCriteria, Pagination pagination) {
        try {
            // Fetch applications from database according to the given search criteria
            enrichEvidenceSearch(requestInfo, evidenceSearchCriteria);
            List<Artifact> artifacts = repository.getArtifacts(evidenceSearchCriteria, pagination);

            // If no applications are found matching the given criteria, return an empty list
            if (CollectionUtils.isEmpty(artifacts)) return new ArrayList<>();
            return artifacts;
        } catch (CustomException e) {
            log.error("Custom Exception occurred while searching");
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching to search results");
            throw new CustomException(EVIDENCE_SEARCH_EXCEPTION, e.toString());
        }
    }

    private void enrichEvidenceSearch(RequestInfo requestInfo, EvidenceSearchCriteria searchCriteria) {
        if(requestInfo.getUserInfo() != null) {
            User userInfo = requestInfo.getUserInfo();
            String userType = userInfo.getType();
            switch (userType.toUpperCase()) {
                case CITIZEN_UPPER -> {
                    searchCriteria.setIsCitizen(true);
                    searchCriteria.setUserUuid(userInfo.getUuid());
                }
                case EMPLOYEE_UPPER -> {
                    searchCriteria.setIsCourtEmployee(true);
                    searchCriteria.setUserUuid(userInfo.getUuid());
                    if(canCourtEmployeeSign(searchCriteria, requestInfo)) {
                        searchCriteria.setCourtEmployeeCanSign(true);
                    }
                }
            }
        }
    }

    private boolean canCourtEmployeeSign(EvidenceSearchCriteria searchCriteria, RequestInfo requestInfo) {
        String tenantId = searchCriteria.getTenantId();

        return requestInfo.getUserInfo().getRoles().stream()
                .anyMatch(role ->
                        tenantId.equals(role.getTenantId()) && (BENCH_CLERK.equals(role.getCode()) || JUDGE_ROLE.equals(role.getCode()) || TYPIST_ROLE.equals(role.getCode()))
                );
    }


    public Artifact updateEvidence(EvidenceRequest evidenceRequest) {
        try {
            Boolean isEvidence = evidenceRequest.getArtifact().getIsEvidence();
            Artifact existingApplication = validateExistingEvidence(evidenceRequest);

            // Update workflow
            existingApplication.setWorkflow(evidenceRequest.getArtifact().getWorkflow());

            String filingType = getFilingTypeMdms(evidenceRequest.getRequestInfo(), evidenceRequest.getArtifact());

            // Enrich application upon update
            evidenceEnrichment.enrichEvidenceRegistrationUponUpdate(evidenceRequest);

            if (evidenceRequest.getArtifact().getIsEvidence().equals(true) && evidenceRequest.getArtifact().getEvidenceNumber() == null) {
                evidenceEnrichment.enrichEvidenceNumber(evidenceRequest);
            }


            if ((evidenceRequest.getArtifact().getArtifactType() != null &&
                    evidenceRequest.getArtifact().getArtifactType().equals(DEPOSITION)) ||
                    (filingType!= null && evidenceRequest.getArtifact().getWorkflow() != null && filingType.equalsIgnoreCase(SUBMISSION))) {
                workflowService.updateWorkflowStatus(evidenceRequest, filingType);
                enrichShortenedURL(evidenceRequest);
                enrichBasedOnStatus(evidenceRequest);
                producer.push(config.getUpdateEvidenceKafkaTopic(), evidenceRequest);
            } else {
                producer.push(config.getUpdateEvidenceWithoutWorkflowKafkaTopic(), evidenceRequest);
            }
            callNotificationService(evidenceRequest,isEvidence,false);
            return evidenceRequest.getArtifact();

        } catch (CustomException e) {
            log.error("Custom Exception occurred while updating evidence", e);
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while updating evidence", e);
            throw new CustomException(EVIDENCE_UPDATE_EXCEPTION, "Error occurred while updating evidence: " + e.toString());
        }
    }

    private void enrichShortenedURL(EvidenceRequest evidenceRequest) {

        Workflow workflow = evidenceRequest.getArtifact().getWorkflow();

        if (INITIATE_E_SIGN.equals(workflow.getAction())) {
            String shortenedUrl = urlShortenerUtil.createShortenedUrl(evidenceRequest.getArtifact().getTenantId() , evidenceRequest.getArtifact().getArtifactNumber());
            evidenceRequest.getArtifact().setShortenedUrl(shortenedUrl);
            callNotificationServiceForSMS(evidenceRequest);
        }

    }

    Artifact validateExistingEvidence(EvidenceRequest evidenceRequest) {
        try {
            return validator.validateEvidenceExistence(evidenceRequest);
        } catch (Exception e) {
            log.error("Error validating existing application", e);
            throw new CustomException(EVIDENCE_UPDATE_EXCEPTION, "Error validating existing application: " + e.toString());
        }
    }

    void enrichBasedOnStatus(EvidenceRequest evidenceRequest) {
        String status = evidenceRequest.getArtifact().getStatus();
        if (PUBLISHED_STATE.equalsIgnoreCase(status)) {
            evidenceEnrichment.enrichEvidenceNumber(evidenceRequest);
        } else if (ABATED_STATE.equalsIgnoreCase(status)) {
            evidenceEnrichment.enrichIsActive(evidenceRequest);
        } else if(DELETED_STATE.equalsIgnoreCase(status)){
            evidenceEnrichment.enrichIsActive(evidenceRequest);
        }
    }

    public void addComments(EvidenceAddCommentRequest evidenceAddCommentRequest) {
        try {
            EvidenceAddComment evidenceAddComment = evidenceAddCommentRequest.getEvidenceAddComment();
            List<Artifact> applicationList = repository.getArtifacts(EvidenceSearchCriteria.builder().artifactNumber(evidenceAddComment.getArtifactNumber()).build(), null);
            if (CollectionUtils.isEmpty(applicationList)) {
                throw new CustomException(COMMENT_ADD_ERR, "Evidence not found");
            }
            AuditDetails auditDetails = createAuditDetails(evidenceAddCommentRequest.getRequestInfo());
            evidenceAddComment.getComment().forEach(comment -> evidenceEnrichment.enrichCommentUponCreate(comment, auditDetails));
            Artifact artifactToUpdate = applicationList.get(0);
            List<Comment> updatedComments = new ArrayList<>(artifactToUpdate.getComments());
            updatedComments.addAll(evidenceAddComment.getComment());
            artifactToUpdate.setComments(updatedComments);
            evidenceAddComment.setComment(updatedComments);

            AuditDetails applicationAuditDetails = artifactToUpdate.getAuditdetails();
            applicationAuditDetails.setLastModifiedBy(auditDetails.getLastModifiedBy());
            applicationAuditDetails.setLastModifiedTime(auditDetails.getLastModifiedTime());

            EvidenceRequest evidenceRequest = new EvidenceRequest();
            evidenceRequest.setArtifact(artifactToUpdate);
            evidenceRequest.setRequestInfo(evidenceAddCommentRequest.getRequestInfo());

            producer.push(config.getEvidenceUpdateCommentsTopic(), evidenceRequest);
        } catch (CustomException e) {
            log.error("Custom exception while adding comments {}", e.toString());
            throw e;
        } catch (Exception e) {
            log.error("Error while adding comments {}", e.toString());
            throw new CustomException(COMMENT_ADD_ERR, e.getMessage());
        }
    }

    private AuditDetails createAuditDetails(RequestInfo requestInfo) {
        return AuditDetails.builder().createdBy(requestInfo.getUserInfo().getUuid()).createdTime(System.currentTimeMillis()).lastModifiedBy(requestInfo.getUserInfo().getUuid()).lastModifiedTime(System.currentTimeMillis()).build();
    }

    private void callNotificationService(EvidenceRequest evidenceRequest,Boolean isEvidence,Boolean isCreateCall) {

        try {
            CaseSearchRequest caseSearchRequest = createCaseSearchRequest(evidenceRequest.getRequestInfo(), evidenceRequest.getArtifact().getFilingNumber());
            JsonNode caseDetails = caseUtil.searchCaseDetails(caseSearchRequest);

            Artifact artifact = evidenceRequest.getArtifact();

            String smsTopic = getSmsTopic(isEvidence, artifact, isCreateCall);
            log.info("Message Code : {}", smsTopic);
            Set<String> individualIds = extractIndividualIds(caseDetails,null);
            Set<String> powerOfAttorneyIds = extractPowerOfAttorneyIds(caseDetails,individualIds);
            individualIds.addAll(powerOfAttorneyIds);

            // Individual ids of filing advocate and related litigant
            Set<String> filingIndividualIds = new HashSet<>();
            Set<String> oppositeIndividualIds = new HashSet<>(individualIds);

            if (smsTopic != null && smsTopic.equalsIgnoreCase(EVIDENCE_SUBMISSION_CODE)) {
                String receiverId = evidenceRequest.getRequestInfo().getUserInfo().getUuid();
                String partyType = getPartyTypeByUUID(caseDetails,receiverId);
                String receiverParty = null;
                if (partyType != null) {
                    receiverParty = getReceiverParty(partyType);
                }
                filingIndividualIds = extractIndividualIds(caseDetails,receiverParty);
                if (receiverParty != null && receiverParty.equalsIgnoreCase(COMPLAINANT)) {
                    // Add the power of attorney ids to the filing advocate ids
                    filingIndividualIds.addAll(powerOfAttorneyIds);
                } else if (receiverParty != null && receiverParty.equalsIgnoreCase(RESPONDENT)) {
                    // Add the power of attorney ids to the opposite party ids
                    oppositeIndividualIds.addAll(powerOfAttorneyIds);
                }
                oppositeIndividualIds.removeAll(filingIndividualIds);
            }

            List<String> smsTopics = new ArrayList<>();
            if (smsTopic != null) {
                smsTopics = List.of(smsTopic.split(","));
            }

            for (String topic : smsTopics) {

                Set<String> phoneNumbers = callIndividualService(evidenceRequest.getRequestInfo(), individualIds);
                if (Objects.equals(topic, EVIDENCE_SUBMISSION_MESSAGE_FILING) || Objects.equals(topic, EVIDENCE_SUBMISSION)) {
                    if (!filingIndividualIds.isEmpty()) {
                        phoneNumbers = callIndividualService(evidenceRequest.getRequestInfo(), filingIndividualIds);
                    }
                }
                if (Objects.equals(topic, EVIDENCE_SUBMISSION_MESSAGE_OPPOSITE_PARTY)) {
                    if (!oppositeIndividualIds.isEmpty()) {
                        phoneNumbers = callIndividualService(evidenceRequest.getRequestInfo(), oppositeIndividualIds);
                    }
                }

                SmsTemplateData smsTemplateData = SmsTemplateData.builder()
                        .courtCaseNumber(caseDetails.has("courtCaseNumber") ? (caseDetails.get("courtCaseNumber").textValue() != null ? caseDetails.get("courtCaseNumber").textValue() : null) : null)
                        .cmpNumber(caseDetails.has("cmpNumber") ? (caseDetails.get("cmpNumber").textValue() != null ? caseDetails.get("cmpNumber").textValue() : null) : null)
                        .artifactNumber(artifact.getArtifactNumber())
                        .filingNumber(caseDetails.has("filingNumber") ? caseDetails.get("filingNumber").textValue() : "")
                        .tenantId(artifact.getTenantId()).build();


                for (String number : phoneNumbers) {
                    notificationService.sendNotification(evidenceRequest.getRequestInfo(), smsTemplateData, topic, number);
                }
            }
        }
        catch (Exception e) {
            // Log the exception and continue the execution without throwing
            log.error("Error occurred while sending notification: {}", e.toString());
        }
    }

    private String getSmsTopic(Boolean isEvidence, Artifact artifact,Boolean isCreateCall) {
        String status = artifact.getStatus();
        String filingType = artifact.getFilingType();
        String smsTopic = null;
        if(artifact.getIsEvidence() && null != artifact.getEvidenceNumber()) {
            smsTopic = "DOCUMENT_MARKED_EXHIBIT";
        }
        if ((!(status == null) && status.equalsIgnoreCase(SUBMITTED) && filingType.equalsIgnoreCase(DIRECT) && (!isEvidence && isCreateCall))
        || ( (filingType.equalsIgnoreCase(CASE_FILING) || filingType.equalsIgnoreCase(APPLICATION)) && (!isEvidence && isCreateCall))) {
            smsTopic = EVIDENCE_SUBMISSION_CODE;
        }
        return smsTopic;
    }

    private static String getReceiverParty(String partyType) {
        if (partyType.toLowerCase().contains(COMPLAINANT.toLowerCase())) {
            return COMPLAINANT;
        } else if (partyType.toLowerCase().contains(RESPONDENT.toLowerCase())) {
            return RESPONDENT;
        }
        else {
            return null;
        }
    }

    public static String getPartyTypeByName(JsonNode litigants, String name) {
        for (JsonNode litigant : litigants) {
            JsonNode additionalDetails = litigant.get("additionalDetails");
            if (additionalDetails != null && additionalDetails.has("fullName")) {
                String fullName = additionalDetails.get("fullName").asText();
                if (name.equals(fullName)) {
                    return litigant.get("partyType").asText();
                }
            }
        }
        return null;
    }

    public static String getPartyTypeByUUID(JsonNode caseDetails,String receiverUUID) {
        JsonNode litigants = caseDetails.get("litigants");
        JsonNode representatives = caseDetails.get("representatives");
        for (JsonNode litigant : litigants) {
            JsonNode additionalDetails = litigant.get("additionalDetails");
            if (additionalDetails != null && additionalDetails.has("uuid")) {
                String uuid = additionalDetails.get("uuid").textValue();
                if (uuid.equals(receiverUUID)) {
                    return litigant.get("partyType").textValue();
                }
            }
        }

        if (representatives.isArray()) {
            for (JsonNode advocateNode : representatives) {
                JsonNode representingNode = advocateNode.get("representing");
                if (representingNode.isArray()) {
                        String uuid = advocateNode.path("additionalDetails").get("uuid").asText();
                        if (uuid.equals(receiverUUID)) {
                            return representingNode.get(0).get("partyType").textValue();
                        }
                }
            }
        }
        return null;
    }

    private CaseSearchRequest createCaseSearchRequest(RequestInfo requestInfo, String fillingNUmber) {
        CaseSearchRequest caseSearchRequest = new CaseSearchRequest();
        caseSearchRequest.setRequestInfo(requestInfo);
        CaseCriteria caseCriteria = CaseCriteria.builder().filingNumber(fillingNUmber).defaultFields(false).build();
        caseSearchRequest.addCriteriaItem(caseCriteria);
        return caseSearchRequest;
    }

    private Set<String> callIndividualService(RequestInfo requestInfo, Set<String> ids) {
        Set<String> mobileNumber = new HashSet<>();

        List<Individual> individuals = individualService.getIndividualsBylId(requestInfo, new ArrayList<>(ids));
        for(Individual individual : individuals) {
            if (individual.getMobileNumber() != null) {
                mobileNumber.add(individual.getMobileNumber());
            }
        }

        return mobileNumber;
    }

    public  Set<String> extractIndividualIds(JsonNode caseDetails,String receiver) {

        JsonNode litigantNode = caseDetails.get("litigants");
        JsonNode representativeNode = caseDetails.get("representatives");
        String partyTypeToMatch = (receiver != null) ? receiver : "";
        Set<String> uuids = new HashSet<>();

        if (litigantNode.isArray()) {
            for (JsonNode node : litigantNode) {
                String uuid = node.path("additionalDetails").get("uuid").asText();
                String partyType = node.get("partyType").asText().toLowerCase();
                if (partyType.toLowerCase().contains(partyTypeToMatch.toLowerCase())) {
                    if (!uuid.isEmpty()) {
                        uuids.add(uuid);
                    }
                }
            }
        }

        if (representativeNode.isArray()) {
            for (JsonNode advocateNode : representativeNode) {
                JsonNode representingNode = advocateNode.get("representing");
                if (representingNode.isArray()) {
                    String partyType = representingNode.get(0).get("partyType").asText().toLowerCase();
                    if (partyType.toLowerCase().contains(partyTypeToMatch.toLowerCase())) {
                        String uuid = advocateNode.path("additionalDetails").get("uuid").asText();
                        if (!uuid.isEmpty()) {
                            uuids.add(uuid);
                        }
                    }
                }
            }
        }
        return uuids;
    }

    public Set<String> extractPowerOfAttorneyIds(JsonNode caseDetails, Set<String> individualIds) {
        JsonNode poaHolders = caseDetails.get("poaHolders");
        if (poaHolders != null && poaHolders.isArray()) {
            for (JsonNode poaHolder : poaHolders) {
                String individualId = poaHolder.path("individualId").textValue();
                if (individualId != null && !individualId.isEmpty()) {
                    individualIds.add(individualId);
                }
            }
        }
        return individualIds;
    }

    private void callNotificationServiceForSMS(EvidenceRequest evidenceRequest) {
        try {
            Artifact artifact = evidenceRequest.getArtifact();
            String action = artifact.getWorkflow().getAction();
            String messageCode = getMessageCode(action);

            if (StringUtils.isBlank(messageCode)) {
                log.warn("No messageCode found for action: {}", action);
                return;
            }

            log.info("Sending notifications for messageCode: {}", messageCode);
            SmsTemplateData smsTemplateData = buildSmsTemplateData(evidenceRequest);

            RequestInfo requestInfo = evidenceRequest.getRequestInfo();

            for (String mobileNumber : artifact.getWitnessMobileNumbers()) {
                notificationService.sendNotification(requestInfo, smsTemplateData, messageCode, mobileNumber);
            }

        } catch (Exception e) {
            log.error("Error sending notification for evidenceRequest: {}", evidenceRequest, e);
        }
    }

    private String getMessageCode(String action) {
        if (action.equalsIgnoreCase(INITIATE_E_SIGN)) {
            return WITNESS_DEPOSITION_CODE;
        }
        return null;
    }

    private SmsTemplateData buildSmsTemplateData(EvidenceRequest evidenceRequest) {

        Artifact artifact = evidenceRequest.getArtifact();

        CaseCriteria criteria = CaseCriteria.builder()
                .filingNumber(artifact.getFilingNumber())
                .defaultFields(true)
                .build();
        CaseSearchRequest caseSearchRequest = CaseSearchRequest.builder()
                .requestInfo(evidenceRequest.getRequestInfo())
                .criteria(Collections.singletonList(criteria))
                .build();
        JsonNode caseDetails = caseUtil.searchCaseDetails(caseSearchRequest);

        String cmpNumber = caseDetails.has("cmpNumber") ? (caseDetails.get("cmpNumber").textValue() != null ? caseDetails.get("cmpNumber").textValue() : null) : null;
        String courtCaseNumber = caseDetails.has("courtCaseNumber") ? (caseDetails.get("courtCaseNumber").textValue() != null ? caseDetails.get("courtCaseNumber").textValue() : null) : null;

        return SmsTemplateData.builder()
                .filingNumber(artifact.getFilingNumber())
                .courtCaseNumber(courtCaseNumber)
                .shortenedUrl(artifact.getShortenedUrl())
                .cmpNumber(cmpNumber)
                .tenantId(artifact.getTenantId())
                .build();

    }

    public List<ArtifactToSign> createArtifactsToSignRequest(ArtifactsToSignRequest request) {
        log.info("creating artifacts to sign request, result= IN_PROGRESS, artifactCriteria:{}", request.getCriteria().size());

        List<CoordinateCriteria> coordinateCriteria = new ArrayList<>();
        Map<String, ArtifactsCriteria> artifactCriteriaMap = new HashMap<>();

        request.getCriteria().forEach(criterion -> {
            CoordinateCriteria criteria = new CoordinateCriteria();
            criteria.setFileStoreId(criterion.getFileStoreId());
            criteria.setPlaceholder(criterion.getPlaceholder());
            criteria.setTenantId(criterion.getTenantId());
            coordinateCriteria.add(criteria);
            artifactCriteriaMap.put(criterion.getFileStoreId(), criterion);
        });

        CoordinateRequest coordinateRequest = CoordinateRequest.builder()
                .requestInfo(request.getRequestInfo())
                .criteria(coordinateCriteria).build();
        List<Coordinate> coordinateForSign = eSignUtil.getCoordinateForSign(coordinateRequest);

        if (coordinateForSign.isEmpty() || coordinateForSign.size() != request.getCriteria().size()) {
            throw new CustomException(COORDINATES_ERROR, "error in co-ordinates");
        }

        List<ArtifactToSign> artifactToSignList = new ArrayList<>();
        for (Coordinate coordinate : coordinateForSign) {
            ArtifactToSign artifactToSign = new ArtifactToSign();
            org.springframework.core.io.Resource resource = null;
            try {
                resource = fileStoreUtil.fetchFileStoreObjectById(coordinate.getFileStoreId(), coordinate.getTenantId());
            } catch (Exception e) {
                throw new CustomException("FILE_STORE_UTILITY_EXCEPTION", "something went wrong while signing");
            }
            try {
                String base64Document = cipherUtil.encodePdfToBase64(resource);
                String coord = (int) Math.floor(coordinate.getX()) + "," + (int) Math.floor(coordinate.getY());
                String txnId = java.util.UUID.randomUUID().toString();
                String pageNo = String.valueOf(coordinate.getPageNumber());
                java.time.ZonedDateTime timestamp = java.time.ZonedDateTime.now(java.time.ZoneId.of(config.getZoneId()));

                String xmlRequest = generateRequest(base64Document, timestamp.toString(), txnId, coord, pageNo);
                String artifactId = artifactCriteriaMap.get(coordinate.getFileStoreId()).getArtifactId();
                artifactToSign.setArtifactId(artifactId);
                artifactToSign.setRequest(xmlRequest);

                artifactToSignList.add(artifactToSign);
            } catch (Exception e) {
                throw new CustomException("ARTIFACT_SIGN_ERROR", "something went wrong while signing");
            }
        }
        log.info("creating artifacts to sign request, result= SUCCESS, artifactCriteria:{}", request.getCriteria().size());
        return artifactToSignList;
    }

    public List<Artifact> updateArtifactWithSignDoc(@Valid UpdateSignedArtifactRequest request) {
        log.info("Updating Artifact With Signed Doc, result= IN_PROGRESS, signedArtifacts:{}", request.getSignedArtifacts() != null ? request.getSignedArtifacts().size() : 0);
        List<Artifact> updatedArtifacts = new ArrayList<>();
        RequestInfo requestInfo = request.getRequestInfo();
        if (request.getSignedArtifacts() != null) {
            for (SignedArtifact signedArtifact : request.getSignedArtifacts()) {
                String artifactId = signedArtifact.getArtifactId();
                String signedArtifactData = signedArtifact.getSignedArtifactData();
                Boolean isSigned = signedArtifact.getSigned();
                String tenantId = signedArtifact.getTenantId();

                if (Boolean.TRUE.equals(isSigned)) {
                    try {
                        // Fetch and validate existing artifact
                        EvidenceSearchCriteria evidenceSearchCriteria = EvidenceSearchCriteria.builder().artifactNumber(artifactId).tenantId(tenantId).fuzzySearch(false).build();
                        Artifact existingArtifact = repository.getArtifacts(evidenceSearchCriteria, null).stream().findFirst().orElse(null);
                        if (existingArtifact == null) {
                            log.error("Artifact not found for id: {}", artifactId);
                            throw new CustomException("ARTIFACT_NOT_FOUND", "Artifact not found for id: " + artifactId);
                        }

                        // Update signed data (assuming a document or field for signed data exists)

                        // Update document with signed PDF
                        MultipartFile multipartFile = cipherUtil.decodeBase64ToPdf(signedArtifactData, ARTIFACT_FILE_NAME);
                        String fileStoreId = fileStoreUtil.storeFileInFileStore(multipartFile, tenantId);

                        Document document = Document.builder()
                                .id(UUID.randomUUID().toString())
                                .documentType(SIGNED)
                                .fileStore(fileStoreId)
                                .additionalDetails(Map.of(NAME, ARTIFACT_FILE_NAME))
                                .build();

                        existingArtifact.setFile(document);


                        WorkflowObject workflow = existingArtifact.getWorkflow();
                        workflow.setAction(SIGNED);
                        existingArtifact.setWorkflow(workflow);

                        EvidenceRequest evidenceRequest = EvidenceRequest.builder().artifact(existingArtifact).requestInfo(requestInfo).build();

                        Artifact artifact = updateEvidence(evidenceRequest);
                        updatedArtifacts.add(artifact);
                        log.info("Updated artifact with signed doc, artifactId: {}", artifactId);
                    } catch (Exception e) {
                        log.error("Error while updating artifact, artifactId: {}", artifactId, e);
                        throw new CustomException("ARTIFACT_BULK_SIGN_EXCEPTION", "Error while updating artifact: " + e.getMessage());
                    }
                }
            }
        }
        return updatedArtifacts;
    }


    private String generateRequest(String base64Doc, String timeStamp, String txnId, String coordination, String pageNumber) {
        log.info("generating request, result= IN_PROGRESS, timeStamp:{}, txnId:{}, coordination:{}, pageNumber:{}", timeStamp, txnId, coordination, pageNumber);
        Map<String, Object> requestData = new LinkedHashMap<>();

        requestData.put(COMMAND, PKI_NETWORK_SIGN);
        requestData.put(TIME_STAMP, timeStamp);
        requestData.put(TXN, txnId);

        List<Map<String, Object>> certificateAttributes = new ArrayList<>();
        certificateAttributes.add(createAttribute("CN", ""));
        certificateAttributes.add(createAttribute("O", ""));
        certificateAttributes.add(createAttribute("OU", ""));
        certificateAttributes.add(createAttribute("T", ""));
        certificateAttributes.add(createAttribute("E", ""));
        certificateAttributes.add(createAttribute("SN", ""));
        certificateAttributes.add(createAttribute("CA", ""));
        certificateAttributes.add(createAttribute("TC", "SG"));
        certificateAttributes.add(createAttribute("AP", "1"));
        requestData.put(CERTIFICATE, certificateAttributes);

        Map<String, Object> file = new LinkedHashMap<>();
        file.put(ATTRIBUTE, Map.of(NAME, TYPE, VALUE, PDF));
        requestData.put(FILE, file);

        Map<String, Object> pdf = new LinkedHashMap<>();
        pdf.put(PAGE, pageNumber);
        pdf.put(CO_ORDINATES, coordination);
        pdf.put(SIZE, "150,100");
        requestData.put(PDF, pdf);

        requestData.put(DATA, base64Doc);

        String xmlRequest = xmlRequestGenerator.createXML("request", requestData);
        log.info("generating request, result= SUCCESS, timeStamp:{}, txnId:{}, coordination:{}, pageNumber:{}", timeStamp, txnId, coordination, pageNumber);

        return xmlRequest;
    }

    private Map<String, Object> createAttribute(String name, String value) {
        Map<String, Object> attribute = new LinkedHashMap<>();
        Map<String, String> attrData = new LinkedHashMap<>();
        attrData.put(NAME, name);
        attrData.put(VALUE, value);
        attribute.put(ATTRIBUTE, attrData);
        return attribute;
    }
}
