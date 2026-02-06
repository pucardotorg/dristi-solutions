package org.pucar.dristi.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Document;
import org.egov.common.contract.models.Workflow;
import org.egov.common.contract.request.RequestInfo;
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
    private final HearingUtil hearingUtil;
    private final DateUtil dateUtil;
    private final ADiaryUtil aDiaryUtil;
    private final EsUtil esUtil;

    @Autowired
    public EvidenceService(EvidenceValidator validator, EvidenceEnrichment evidenceEnrichment, WorkflowService workflowService, EvidenceRepository repository, Producer producer, Configuration config, MdmsUtil mdmsUtil, CaseUtil caseUtil, ObjectMapper objectMapper, SmsNotificationService notificationService, IndividualService individualService, UrlShortenerUtil urlShortenerUtil, ESignUtil eSignUtil, FileStoreUtil fileStoreUtil, CipherUtil cipherUtil, XmlRequestGenerator xmlRequestGenerator, HearingUtil hearingUtil, DateUtil dateUtil, ADiaryUtil aDiaryUtil, EsUtil esUtil) {
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
        this.hearingUtil = hearingUtil;
        this.dateUtil = dateUtil;
        this.aDiaryUtil = aDiaryUtil;
        this.esUtil = esUtil;
    }

    private boolean shouldUpdateWorkflowStatusForUpdate(EvidenceRequest evidenceRequest, String filingType){
        String artifactType = evidenceRequest.getArtifact().getArtifactType();
        boolean hasWorkflow = evidenceRequest.getArtifact().getWorkflow() != null;
        boolean isArtifactTypeDeposition = DEPOSITION.equalsIgnoreCase(artifactType);
        boolean isFilingTypeDirect = DIRECT.equalsIgnoreCase(filingType);
        boolean isEvidenceMarkedFlow = Boolean.TRUE.equals(evidenceRequest.getArtifact().getIsEvidenceMarkedFlow());
        boolean isArtifactTypeWitnessDeposition = WITNESS_DEPOSITION.equalsIgnoreCase(artifactType);

        return ((isEvidenceMarkedFlow || isArtifactTypeDeposition || isFilingTypeDirect) && hasWorkflow) || isArtifactTypeWitnessDeposition;
    }

    public Artifact createEvidence(EvidenceRequest body) {
        try {

            // Validate applications
            validator.validateEvidenceRegistration(body);

            String filingType = getFilingTypeMdms(body.getRequestInfo(), body.getArtifact());

            // Enrich applications
            evidenceEnrichment.enrichEvidenceRegistration(body);

            String tag = body.getArtifact().getTag();
            String artifactType = body.getArtifact().getArtifactType();
            if(WITNESS_DEPOSITION.equalsIgnoreCase(artifactType) &&
                    SAVE_DRAFT.equalsIgnoreCase(body.getArtifact().getWorkflow().getAction())) {
                validateWitnessDeposition(body);
                if(tag != null && !hasNumberSuffix(tag)){
                    tag = evidenceEnrichment.enrichPseudoTag(body);
                }
            }
            // Initiate workflow for the new application- //todo witness deposition is part of case filing or not
            if (artifactType != null && artifactType.equals(DEPOSITION) || body.getArtifact().getWorkflow() != null && filingType.equalsIgnoreCase(SUBMISSION) || WITNESS_DEPOSITION.equalsIgnoreCase(artifactType)) {
                workflowService.updateWorkflowStatus(body, filingType);
                producer.push(config.getEvidenceCreateTopic(), body);
            } else {
                producer.push(config.getEvidenceCreateWithoutWorkflowTopic(), body);
            }
            if(tag != null && !tag.isEmpty()) {
                body.getArtifact().setTag(tag);
            }
            CaseSearchRequest caseSearchRequest = createCaseSearchRequest(body.getRequestInfo(), body.getArtifact().getFilingNumber());
            JsonNode caseNode = caseUtil.searchCaseDetails(caseSearchRequest);
            String stage = Optional.ofNullable(caseNode)
                    .map(n -> n.path("stage"))
                    .map(n -> n.asText(""))
                    .orElse("");

            if(!WITNESS_DEPOSITION.equalsIgnoreCase(artifactType) ||
                    (WITNESS_DEPOSITION.equalsIgnoreCase(artifactType) && Trial.equalsIgnoreCase(stage))) {
                callNotificationService(body,false,true);
            }
            return body.getArtifact();
        } catch (CustomException e) {
            log.error("Custom Exception occurred while creating evidence");
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while creating evidence");
            throw new CustomException(EVIDENCE_CREATE_EXCEPTION, e.toString());
        }
    }

    private void validateWitnessDeposition(EvidenceRequest body) {
        if(body.getArtifact().getTag() == null || body.getArtifact().getSourceID() == null){
            throw new CustomException(ENRICHMENT_EXCEPTION, "Tag or SourceID is required for witness deposition");
        }
        EvidenceSearchCriteria evidenceSearchCriteria = createEvidenceSearchCriteria(body);
        List<Artifact> artifacts = repository.getArtifacts(evidenceSearchCriteria, null);
        boolean witnessFound = artifacts.stream().anyMatch(artifact -> artifact.getTag() != null && artifact.getTag().equalsIgnoreCase(body.getArtifact().getTag()));
        if (witnessFound) {
            log.info("Tag already exists for the witness with source:{} ", body.getArtifact().getSourceType());
        }
    }

    private EvidenceSearchCriteria createEvidenceSearchCriteria(EvidenceRequest body) {
        return EvidenceSearchCriteria.builder()
                .filingNumber(body.getArtifact().getFilingNumber())
                .artifactType(WITNESS_DEPOSITION)
                .tenantId(body.getArtifact().getTenantId())
                .build();
    }

    public void updateCaseWitnessDeposition(EvidenceRequest body) {
        log.info("Starting updateCaseWitness for filing number: {}",
                body.getArtifact() != null ? body.getArtifact().getFilingNumber() : null);

        try {
            String filingNumber = body.getArtifact().getFilingNumber();
            String uniqueId = body.getArtifact().getSourceID();

            JsonNode courtCase = searchCaseDetails(body, filingNumber);

            JsonNode witnessDetailsNode = courtCase.get("witnessDetails");
            if (StringUtils.isBlank(uniqueId) || witnessDetailsNode == null || !witnessDetailsNode.isArray()) {
                log.info("Witness list missing/invalid or uniqueId blank; falling back to legacy path. uniqueIdPresent={}", StringUtils.isNotBlank(uniqueId));
                updateWitnessDeposition(body, courtCase);
                return;
            }
            List<WitnessDetails> witnessDetails = objectMapper.convertValue(witnessDetailsNode, new TypeReference<>() {});
            WitnessDetails witness = witnessDetails.stream()
                    .filter(w -> StringUtils.isNotBlank(w.getUniqueId()) && StringUtils.equalsIgnoreCase(w.getUniqueId(), uniqueId))
                    .findFirst()
                    .orElse(null);
            if (witness != null) {
                log.info("Updating witness found by uniqueId");
                updateWitnessRecord(body, uniqueId, witness);
            } else {
                log.info("No matching witness by uniqueId; using legacy update path");
                updateWitnessDeposition(body, courtCase);
            }
            log.info("Successfully completed updateCaseWitness for filing number: {}", filingNumber);

        } catch (CustomException e) {
            log.error("Unexpected error in updateCaseWitness for filing number: {}",
                    body.getArtifact() != null ? body.getArtifact().getFilingNumber() : "null", e);
            throw new CustomException(UPDATE_CASE_WITNESS_ERR,
                    "Unexpected error updating case witness: " + e.getMessage());
        }
    }

    private void updateWitnessDeposition(EvidenceRequest body, JsonNode courtCase) {
        JsonNode litigants = courtCase.get("litigants");
        JsonNode representatives = courtCase.get("representatives");
        JsonNode poaHolders = courtCase.get("poaHolders");
        JsonNode respondentDetails = courtCase.get("additionalDetails").get("respondentDetails");
        String uniqueId = body.getArtifact().getSourceID();
        String tag = body.getArtifact().getTag();

        // Process litigants
        if (litigants != null && litigants.isArray()) {
            updatePartyTag(litigants, uniqueId, tag, "litigant");
        }

        // Process representatives
        if (representatives != null && representatives.isArray()) {
            updatePartyTag(representatives, uniqueId, tag, "representative");
        }

        // Process poaHolders
        if (poaHolders != null && poaHolders.isArray()) {
            updatePartyTag(poaHolders, uniqueId, tag, "poaHolder");
        }

        // Process respondents
        if(respondentDetails != null && respondentDetails.get("formdata").isArray()) {
            updateAccusedDetails(respondentDetails, uniqueId, tag);
        }
        try {
            CaseRequest caseRequest = CaseRequest.builder()
                    .requestInfo(body.getRequestInfo())
                    .cases(courtCase)
                    .build();
            caseUtil.updateCaseDetails(caseRequest);
        } catch (CustomException e) {
            log.error("Error updating case details for filing number: {}", body.getArtifact().getFilingNumber(), e);
            throw new CustomException(UPDATE_CASE_ERR, e.getMessage());
        }
    }

    private void updateAccusedDetails(JsonNode respondentDetails, String uniqueId, String tag) {
        JsonNode formdata = respondentDetails.get("formdata");
        for(JsonNode data : formdata) {
            if(uniqueId.equals(data.get("uniqueId").textValue())) {
                ((ObjectNode) data.get("data")).put("tag", tag);
                log.info("Added tag: {} to respondent details for uniqueId: {}", tag, uniqueId);
            }
        }
    }

    private void updatePartyTag(JsonNode parties, String uniqueId, String tag, String partyType) {
        for (int i = 0; i < parties.size(); i++) {
            JsonNode party = parties.get(i);
            JsonNode additionalDetails = party.get("additionalDetails");

            if (additionalDetails != null) {
                JsonNode uuid = additionalDetails.get("uuid");
                if (uuid != null && uniqueId.equals(uuid.textValue())) {
                    log.info("Found matching {} with uuid: {} for uniqueId: {}", partyType, uuid.textValue(), uniqueId);

                    if (additionalDetails instanceof ObjectNode) {
                        ((ObjectNode) additionalDetails).put("tag", tag);
                        log.info("Added tag: {} to {} additionalDetails for uuid: {}", tag, partyType, uuid.textValue());
                    }
                    return;
                }
            }
        }
    }

    public JsonNode searchCaseDetails(EvidenceRequest body, String filingNumber) {
        try {
            return caseUtil.searchCaseDetails(
                    CaseSearchRequest.builder()
                            .requestInfo(body.getRequestInfo())
                            .criteria(List.of(CaseCriteria.builder()
                                    .filingNumber(filingNumber)
                                    .defaultFields(false)
                                    .build()))
                            .build()
            );
        } catch (Exception e) {
            log.error("Error while searching case details for filing number: {}", filingNumber, e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_CASE,
                    "Failed to retrieve case details for filing number: " + filingNumber);
        }
    }

    @Deprecated
    public JsonNode extractWitnessFormData(JsonNode courtCase, String filingNumber) {
        JsonNode additionalDetails = courtCase.get("additionalDetails");
        JsonNode witnessDetails = additionalDetails.get("witnessDetails");
        JsonNode formdata = witnessDetails.get("formdata");

        if (formdata == null || !formdata.isArray()) {
            log.warn("No witness formdata found or invalid format for filing number: {}", filingNumber);
            throw new CustomException(UPDATE_CASE_WITNESS_ERR,
                    "No witness formdata found for filing number: " + filingNumber);
        }

        return formdata;
    }

    @Deprecated
    private boolean processWitnessRecords(EvidenceRequest body, String filingNumber, String uniqueId, JsonNode formdata) {
        boolean witnessFound = false;
        for (int i = 0; i < formdata.size(); i++) {
            JsonNode data = formdata.get(i);
            try {
                if (data == null || data.get("uniqueId") == null) {
                    log.warn("Skipping witness record at index {} - missing uniqueId for filing number: {}",
                            i, filingNumber);
                    continue;
                }
                String witnessUniqueId = data.get("uniqueId").textValue();
                if (witnessUniqueId != null && witnessUniqueId.equals(uniqueId)) {
                    witnessFound = true;
                    break;
                }
            } catch (CustomException e) {
                log.error("Unexpected error processing witness record at index {} for filing number: {}",
                        i, filingNumber, e);
                throw new CustomException(UPDATE_CASE_WITNESS_ERR,
                        "Unexpected error processing witness record at index " + i +
                                " for filing number: " + filingNumber);
            }
        }

        if (!witnessFound) {
            log.warn("No witness found with uniqueId: {} in filing number: {}", uniqueId, filingNumber);
        }
        return witnessFound;
    }

    private void updateWitnessRecord(EvidenceRequest body, String uniqueId, WitnessDetails witness) {
        witness.setUniqueId(uniqueId);
        witness.setWitnessTag(body.getArtifact().getTag());

        // Remark: may need to add email later to witness details
//        updateWitnessEmails(body, witness);
        if(body.getArtifact().getWitnessMobileNumbers() != null && !body.getArtifact().getWitnessMobileNumbers().isEmpty()){
            updateWitnessMobileNumbers(body, witness);
        }

        WitnessDetailsRequest witnessDetailsRequest = WitnessDetailsRequest.builder()
                .requestInfo(body.getRequestInfo())
                .witnessDetails(List.of(witness))
                .caseFilingNumber(body.getArtifact().getFilingNumber())
                .tenantId(body.getArtifact().getTenantId())
                .build();

        try {
            caseUtil.updateWitnessDetails(witnessDetailsRequest);
        } catch (Exception e) {
            log.error("Error updating witness details for uniqueId: {} in filing number: {}",
                    uniqueId, body.getArtifact().getFilingNumber(), e);
            throw new CustomException(UPDATE_CASE_WITNESS_ERR,
                    "Failed to update witness details for uniqueId: " + uniqueId +
                            " in filing number: " + body.getArtifact().getFilingNumber());
        }
    }


    private void updateWitnessMobileNumbers(EvidenceRequest body, WitnessDetails witness) {
        if (witness.getPhoneNumbers() == null) {
            if (body.getArtifact() != null && body.getArtifact().getWitnessMobileNumbers() != null) {
                ObjectNode phonenumbers = objectMapper.createObjectNode();
                ArrayNode mobileNumbersArray = objectMapper.valueToTree(body.getArtifact().getWitnessMobileNumbers());
                phonenumbers.set("mobileNumber", mobileNumbersArray);
                witness.setPhoneNumbers(phonenumbers);
            } else {
                witness.setPhoneNumbers(null);
            }
            return;
        }

        List<String> mobileNumbers = getMobileNumbers(body, witness);

        if (!mobileNumbers.isEmpty()) {
            ObjectNode phonenumbers = objectMapper.createObjectNode();
            ArrayNode mobileNumbersArray = objectMapper.valueToTree(mobileNumbers);
            phonenumbers.set("mobileNumber", mobileNumbersArray);
            witness.setPhoneNumbers(phonenumbers);
        } else {
            witness.setPhoneNumbers(null);
        }
    }

    private List<String> getMobileNumbers(EvidenceRequest body, WitnessDetails witness) {
        List<String> mobileNumbers = new ArrayList<>();
        JsonNode witnessMobileNumbers = objectMapper.convertValue(witness.getPhoneNumbers(), JsonNode.class);
        for(JsonNode mobileNumberNode : witnessMobileNumbers.get("mobileNumber")) {
            if(body.getArtifact().getWitnessMobileNumbers() != null
                    && !body.getArtifact().getWitnessMobileNumbers().contains(mobileNumberNode.textValue())) {
                mobileNumbers.add(mobileNumberNode.textValue());
            }
        }
        return mobileNumbers;
    }

    private void updateWitnessEmails(EvidenceRequest body, WitnessDetails witness) {
        if (witness.getEmails() == null) {
            if (body.getArtifact() != null && body.getArtifact().getWitnessEmails() != null) {
                ObjectNode emails = objectMapper.createObjectNode();
                ArrayNode emailArray = objectMapper.valueToTree(body.getArtifact().getWitnessEmails());
                emails.set("emailId", emailArray);
                witness.setEmails(emails);
            } else {
                witness.setEmails(null);
            }
            return;
        }

        List<String> emailIds = getEmailIds(body, witness);

        if (!emailIds.isEmpty()) {
            ObjectNode emails = objectMapper.createObjectNode();
            ArrayNode emailArray = objectMapper.valueToTree(emailIds);
            emails.set("emailId", emailArray);
            witness.setEmails(emails);
        } else {
            witness.setEmails(null);
        }
    }


    private List<String> getEmailIds(EvidenceRequest body, WitnessDetails witness) {
        List<String> emailIds = new ArrayList<>();
        JsonNode witnessEmails = objectMapper.convertValue(witness.getEmails(), JsonNode.class);
        for(JsonNode emailNode : witnessEmails.get("emailId")) {
            if(body.getArtifact().getWitnessEmails() != null &&
                    !body.getArtifact().getWitnessEmails().contains(emailNode.textValue())) {
                emailIds.add(emailNode.textValue());
            }
        }
        return emailIds;
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
        if(requestInfo != null && requestInfo.getUserInfo() != null) {
            User userInfo = requestInfo.getUserInfo();
            String userType = userInfo.getType();
            switch (userType.toUpperCase()) {
                case CITIZEN_UPPER -> {
                    searchCriteria.setIsCitizen(true);
                    searchCriteria.setUserUuid(userInfo.getUuid());
                    enrichAdvocateOrClerkUuids(requestInfo, searchCriteria);
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

    private void enrichAdvocateOrClerkUuids(RequestInfo requestInfo, EvidenceSearchCriteria searchCriteria) {
        User userInfo = requestInfo.getUserInfo();
        String userUuid = userInfo.getUuid();
        String tenantId = config.getTenantId();

        boolean isAdvocate = hasRole(userInfo, ADVOCATE_ROLE);
        boolean isClerk = hasRole(userInfo, ADVOCATE_CLERK_ROLE);

        if (!isAdvocate && !isClerk) {
            return;
        }

        searchCriteria.setAdvocate(isAdvocate);
        searchCriteria.setClerk(isClerk);

        String filingNumber = searchCriteria.getFilingNumber();
        String caseId = searchCriteria.getCaseId();

        if ((filingNumber == null || filingNumber.isEmpty()) && (caseId == null || caseId.isEmpty())) {
            return;
        }

        try {

            CourtCase courtCase = caseUtil.getCase(filingNumber, tenantId, requestInfo);

            if (courtCase == null || courtCase.getAdvocateOffices() == null) {
                return;
            }

            Set<String> uuidSet = new HashSet<>();
            List<AdvocateOffice> advocateOffices = courtCase.getAdvocateOffices();

            for (AdvocateOffice office : advocateOffices) {
                boolean userBelongsToOffice = false;

                if (isClerk && office.getClerks() != null) {
                    userBelongsToOffice = office.getClerks().stream()
                            .anyMatch(clerk -> userUuid.equals(clerk.getMemberUserUuid()));
                }

                if (isAdvocate) {
                    if (userUuid.equals(office.getOfficeAdvocateUserUuid())) {
                        userBelongsToOffice = true;
                    } else if (office.getAdvocates() != null) {
                        userBelongsToOffice = userBelongsToOffice || office.getAdvocates().stream()
                                .anyMatch(advocate -> userUuid.equals(advocate.getMemberUserUuid()));
                    }
                }

                if (userBelongsToOffice) {
                    if (office.getOfficeAdvocateUserUuid() != null) {
                        uuidSet.add(office.getOfficeAdvocateUserUuid());
                    }

                    if (office.getAdvocates() != null) {
                        office.getAdvocates().forEach(advocate -> {
                            if (advocate.getMemberUserUuid() != null) {
                                uuidSet.add(advocate.getMemberUserUuid());
                            }
                        });
                    }

                    if (office.getClerks() != null) {
                        office.getClerks().forEach(clerk -> {
                            if (clerk.getMemberUserUuid() != null) {
                                uuidSet.add(clerk.getMemberUserUuid());
                            }
                        });
                    }
                }
            }

            if (isAdvocate) {
                uuidSet.add(userUuid);
            }

            searchCriteria.setAdvocateAndClerkUuids(new ArrayList<>(uuidSet));
            log.info("Enriched userUuids for advocate/clerk search: {}", uuidSet);

        } catch (Exception e) {
            log.error("Error while enriching advocate/clerk UUIDs for evidence search", e);
        }
    }

    private boolean hasRole(User userInfo, String roleCode) {
        if (userInfo.getRoles() == null) {
            return false;
        }
        return userInfo.getRoles().stream()
                .anyMatch(role -> roleCode.equals(role.getCode()));
    }

    private boolean canCourtEmployeeSign(EvidenceSearchCriteria searchCriteria, RequestInfo requestInfo) {
        String tenantId = searchCriteria.getTenantId();

        return requestInfo.getUserInfo().getRoles().stream()
                .anyMatch(role ->
                        tenantId.equals(role.getTenantId()) && (EVIDENCE_SIGNER.equals(role.getCode()))
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

            if (evidenceRequest.getArtifact().getIsEvidenceMarkedFlow()) {
                String action = Optional.of(evidenceRequest.getArtifact())
                        .map(Artifact::getWorkflow)
                        .map(Workflow::getAction)
                        .orElse(null);
                if(DELETE_DRAFT.equalsIgnoreCase(action)) {
                    evidenceRequest.getArtifact().setEvidenceNumber(null);
                }

                else {
                    // check if the evidence number already exists for the case
                    checkUniqueEvidenceNumberForCase(evidenceRequest);
                }
            }
            String pseudoTag = null;
            if(WITNESS_DEPOSITION.equalsIgnoreCase(evidenceRequest.getArtifact().getArtifactType())) {
                if(SUBMIT.equalsIgnoreCase(evidenceRequest.getArtifact().getWorkflow().getAction()) &&
                        !hasNumberSuffix(evidenceRequest.getArtifact().getTag())) {
                    evidenceEnrichment.enrichTag(evidenceRequest);
                } else if(!hasNumberSuffix(evidenceRequest.getArtifact().getTag())) {
                    pseudoTag = evidenceEnrichment.enrichPseudoTag(evidenceRequest);
                }
                updateCaseWitnessDeposition(evidenceRequest);
            }

            if (shouldUpdateWorkflowStatusForUpdate(evidenceRequest, filingType)) {
                workflowService.updateWorkflowStatus(evidenceRequest, filingType);
                if (INITIATE_E_SIGN.equalsIgnoreCase(evidenceRequest.getArtifact().getWorkflow().getAction())) {
                    enrichShortenedURL(evidenceRequest);
                }
                if (EDIT.equalsIgnoreCase(evidenceRequest.getArtifact().getWorkflow().getAction()) && WITNESS_DEPOSITION.equalsIgnoreCase(evidenceRequest.getArtifact().getArtifactType())) {
                    expireTheShorteningUrl(evidenceRequest);
                }
                enrichBasedOnStatus(evidenceRequest);
                producer.push(config.getUpdateEvidenceKafkaTopic(), evidenceRequest);
            } else {
                producer.push(config.getUpdateEvidenceWithoutWorkflowKafkaTopic(), evidenceRequest);
            }
            // update status entry in es, if this will break need to handle other so that process should complete
            updateOpenArtifactIndex(evidenceRequest);

            if(pseudoTag != null) {
                evidenceRequest.getArtifact().setTag(pseudoTag);
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
            callNotificationServiceForEmail(evidenceRequest);
        }

    }

    private void expireTheShorteningUrl(EvidenceRequest bailRequest) {
        urlShortenerUtil.expireTheUrl(bailRequest);
    }

    public void checkUniqueEvidenceNumberForCase(EvidenceRequest body){

        // Check if evidence number is valid
        String evidenceNumber = body.getArtifact().getEvidenceNumber();
        String filingNumber = body.getArtifact().getFilingNumber();

        if(evidenceNumber == null || !evidenceNumber.startsWith(filingNumber)){
            throw new CustomException(EVIDENCE_UPDATE_EXCEPTION, "Evidence Number must start with case Filing Number");
        }

        // Throw exception if evidence number exists
        EvidenceSearchCriteria criteria = EvidenceSearchCriteria.builder()
                .filingNumber(filingNumber)
                .evidenceNumber(evidenceNumber)
                .tenantId(body.getArtifact().getTenantId())
                .build();
        Pagination pagination = Pagination.builder()
                .build();
        List<Artifact> artifactsList = searchEvidence(body.getRequestInfo(), criteria, pagination).stream()
                .filter(artifact -> !Objects.equals(artifact.getArtifactNumber(), body.getArtifact().getArtifactNumber()))
                .toList();
        if(!artifactsList.isEmpty()){
            throw new CustomException(EVIDENCE_NUMBER_EXISTS_EXCEPTION, String.format("Evidence Number %s already exists for case: %s", body.getArtifact().getEvidenceNumber(), body.getArtifact().getFilingNumber()));
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
        if (ABATED_STATE.equalsIgnoreCase(status) || DELETED_STATE.equalsIgnoreCase(status) || DELETED_DRAFT_STATE.equalsIgnoreCase(status)) {
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

            String sourceType = evidenceRequest.getArtifact().getSourceType();
            String action = evidenceRequest.getArtifact().getWorkflow().getAction();
            String smsTopic = getSmsTopic(sourceType, isCreateCall, action);
            log.info("Message Code : {}", smsTopic);
            Set<String> litigantIndividualIds = extractLitigantIndividualIds(caseDetails,null);
            Set<String> individualIds = new HashSet<>(litigantIndividualIds);
            Set<String> powerOfAttorneyIds = extractPowerOfAttorneyIds(caseDetails,individualIds);
            individualIds.addAll(powerOfAttorneyIds);



            List<String> smsTopics = new ArrayList<>();
            if (smsTopic != null) {
                smsTopics = List.of(smsTopic.split(","));
            }

            for (String topic : smsTopics) {

                Set<String> phoneNumbers = callIndividualService(evidenceRequest.getRequestInfo(), litigantIndividualIds);

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

    private String getSmsTopic(String sourceType, boolean isCreateCall, String action) {
        if(!isCreateCall && COMPLAINANT.equals(sourceType) && E_SIGN.equals(action)) {
            return DOCUMENT_SUBMITTED;
        }
        return null;
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

    public  Set<String> extractLitigantIndividualIds(JsonNode caseDetails, String receiver) {

        JsonNode litigantNode = caseDetails.get("litigants");
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

        return uuids;
    }

    public Set<String> extractAdvocateIndividualIds(JsonNode caseDetails,String receiver) {

        JsonNode representativeNode = caseDetails.get("representatives");
        String partyTypeToMatch = (receiver != null) ? receiver : "";
        Set<String> uuids = new HashSet<>();

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
            return WITNESS_DEPOSITION_MESSAGE;
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
                .shortenedUrl(artifact.getShortenedUrl())
                .build();

    }

    private void callNotificationServiceForEmail(EvidenceRequest evidenceRequest) {
        try {
            Artifact artifact = evidenceRequest.getArtifact();
            String action = artifact.getWorkflow().getAction();

            String emailCode = getEmailCode(action);
            if (StringUtils.isBlank(emailCode)) {
                log.warn("No emailCode found for action: {}", action);
                return;
            }

            log.info("Sending emails for emailCode: {}", emailCode);
            Set<String> emailTopics = Arrays.stream(emailCode.split(","))
                    .map(String::trim)
                    .collect(java.util.stream.Collectors.toSet());

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
            String caseTitle = caseDetails.has("caseTitle") ? (caseDetails.get("caseTitle").textValue() != null ? caseDetails.get("caseTitle").textValue() : null) : null;

            EmailTemplateData emailTemplateData = EmailTemplateData.builder()
                    .caseNumber(courtCaseNumber != null ? courtCaseNumber : cmpNumber)
                    .caseName(caseTitle != null ? caseTitle : "")
                    .shortenedURL(artifact.getShortenedUrl())
                    .tenantId(artifact.getTenantId())
                    .artifactNumber(artifact.getArtifactNumber())
                    .filingNumber(artifact.getFilingNumber())
                    .build();

            if (emailTopics.contains(WITNESS_DEPOSITION_EMAIL)) {
                log.info("Sending email to witnesses");
                if (artifact.getWitnessEmails() != null && !artifact.getWitnessEmails().isEmpty()) {
                    for (String witnessEmail : artifact.getWitnessEmails()) {
                        notificationService.sendEmail(evidenceRequest.getRequestInfo(), emailTemplateData, artifact.getSourceName(), witnessEmail);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error sending notification for evidenceRequest: {}", evidenceRequest, e);
        }
    }

    private String getEmailCode(String action) {
        if (action.equalsIgnoreCase(INITIATE_E_SIGN)) {
            return WITNESS_DEPOSITION_EMAIL;
        }
        return null;
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
                throw new CustomException(FILE_STORE_UTILITY_EXCEPTION, "something went wrong while signing");
            }
            try {
                String base64Document = cipherUtil.encodePdfToBase64(resource);
                String coord = (int) Math.floor(coordinate.getX()) + "," + (int) Math.floor(coordinate.getY());
                String txnId = java.util.UUID.randomUUID().toString();
                String pageNo = String.valueOf(coordinate.getPageNumber());
                java.time.ZonedDateTime timestamp = java.time.ZonedDateTime.now(java.time.ZoneId.of(config.getZoneId()));

                String xmlRequest = generateRequest(base64Document, timestamp.toString(), txnId, coord, pageNo);
                String artifactId = artifactCriteriaMap.get(coordinate.getFileStoreId()).getArtifactNumber();
                artifactToSign.setArtifactNumber(artifactId);
                artifactToSign.setRequest(xmlRequest);

                artifactToSignList.add(artifactToSign);
            } catch (Exception e) {
                throw new CustomException(ARTIFACT_SIGN_ERROR, "something went wrong while signing");
            }
        }
        log.info("creating artifacts to sign request, result= SUCCESS, artifactCriteria:{}", request.getCriteria().size());
        return artifactToSignList;
    }

    public List<Artifact> updateArtifactWithSignDoc(@Valid UpdateSignedArtifactRequest request) {
        log.info("Updating Artifact With Signed Doc, result= IN_PROGRESS, signedArtifacts:{}", request.getSignedArtifacts() != null ? request.getSignedArtifacts().size() : 0);
        List<Artifact> updatedArtifacts = new ArrayList<>();
        List<CaseDiaryEntry> caseDiaryEntries = new ArrayList<>();
        RequestInfo requestInfo = request.getRequestInfo();
        if (request.getSignedArtifacts() != null) {
            for (SignedArtifact signedArtifact : request.getSignedArtifacts()) {
                String artifactNumber = signedArtifact.getArtifactNumber();
                String signedArtifactData = signedArtifact.getSignedArtifactData();
                Boolean isSigned = signedArtifact.getSigned();
                Boolean isWitnessDeposition = signedArtifact.getIsWitnessDeposition();
                String tenantId = signedArtifact.getTenantId();

                if (Boolean.TRUE.equals(isSigned)) {
                    try {
                        // Fetch and validate existing artifact
                        EvidenceSearchCriteria evidenceSearchCriteria = EvidenceSearchCriteria.builder().artifactNumber(artifactNumber).tenantId(tenantId).fuzzySearch(false).build();
                        Artifact existingArtifact = repository.getArtifacts(evidenceSearchCriteria, null).stream().findFirst().orElse(null);
                        if (existingArtifact == null) {
                            log.error("Artifact not found for id: {}", artifactNumber);
                            throw new CustomException(ARTIFACT_NOT_FOUND, "Artifact not found for id: " + artifactNumber);
                        }

                        String fileName = signedArtifact.getIsWitnessDeposition() != null && signedArtifact.getIsWitnessDeposition() ? SIGNED_WITNESS_DEPOSITION_DOCUMENT : SIGNED_EVIDENCE_SEAL;

                        // Update signed data (assuming a document or field for signed data exists)

                        // Update document with signed PDF
                        MultipartFile multipartFile = cipherUtil.decodeBase64ToPdf(signedArtifactData, fileName);
                        String fileStoreId = fileStoreUtil.storeFileInFileStore(multipartFile, tenantId);

                        WorkflowObject workflow = new WorkflowObject();

                        if (isWitnessDeposition != null && isWitnessDeposition) {
                            Document document = Document.builder()
                                    .id(UUID.randomUUID().toString())
                                    .documentType(SIGNED)
                                    .fileStore(fileStoreId)
                                    .additionalDetails(Map.of(NAME, fileName))
                                    .build();
                            existingArtifact.setFile(document);
                            workflow.setAction(SIGN);
                            existingArtifact.setIsEvidenceMarkedFlow(Boolean.FALSE);
                        }
                        else{
                            Document seal = Document.builder()
                                    .id(UUID.randomUUID().toString())
                                    .documentType(SIGNED)
                                    .fileStore(fileStoreId)
                                    .additionalDetails(Map.of(NAME, fileName))
                                    .build();
                            existingArtifact.setSeal(seal);
                            workflow.setAction(E_SIGN);
                            existingArtifact.setIsEvidenceMarkedFlow(Boolean.TRUE);
                            existingArtifact.setIsEvidence(Boolean.TRUE);

                            log.info("creating case diary entries for artifactNumber: {}", existingArtifact.getArtifactNumber());
                            List<CaseDiaryEntry> diaryEntries = createADiaryEntries(existingArtifact, requestInfo);
                            caseDiaryEntries.addAll(diaryEntries);
                        }
                        existingArtifact.setWorkflow(workflow);

                        EvidenceRequest evidenceRequest = EvidenceRequest.builder().artifact(existingArtifact).requestInfo(requestInfo).build();

                        Artifact artifact = updateEvidence(evidenceRequest);
                        updatedArtifacts.add(artifact);
                        log.info("Updated artifact with signed doc, artifactNumber: {}", artifactNumber);
                    } catch (Exception e) {
                        log.error("Error while updating artifact, artifactNumber: {}", artifactNumber, e);
                        throw new CustomException(ARTIFACT_BULK_SIGN_EXCEPTION, "Error while updating artifact: " + e.getMessage());
                    }
                }
            }

            if(!caseDiaryEntries.isEmpty()) {
                try {
                    log.info("creating case diary entry for order, result= IN_PROGRESS, caseDiaryEntries:{}", caseDiaryEntries.size());
                    aDiaryUtil.createBulkADiaryEntry(BulkDiaryEntryRequest.builder()
                            .requestInfo(request.getRequestInfo())
                            .caseDiaryList(caseDiaryEntries)
                            .build());
                } catch (Exception ex) {
                    log.error("Error occurred while creating bulk case diary entries: {}", ex.getMessage(), ex);
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
        pdf.put(SIZE, config.getEsignSignatureWidth() + "," + config.getEsignSignatureHeight());
        pdf.put(DATE_FORMAT, ESIGN_DATE_FORMAT);
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


    public List<CaseDiaryEntry> createADiaryEntries(Artifact artifact, RequestInfo requestInfo) {

        log.info("finding case for filingNumber: {}", artifact.getFilingNumber());

        JsonNode caseDetails = null;
        try {

            caseDetails = caseUtil.searchCaseDetails(CaseSearchRequest.builder()
                    .criteria(Collections.singletonList(CaseCriteria.builder().filingNumber(artifact.getFilingNumber()).tenantId(artifact.getTenantId()).defaultFields(false).build()))
                    .requestInfo(requestInfo).build());

        } catch (Exception e) {
            log.error("Unexpected error occurred while fetching case details", e);
            throw new CustomException(ERROR_WHILE_FETCHING_FROM_CASE,
                    "Failed to retrieve case details for filing number: " + artifact.getFilingNumber());
        }

        List<Hearing> hearings = hearingUtil.fetchHearing(HearingSearchRequest.builder()
                .criteria(HearingCriteria.builder().tenantId(artifact.getTenantId())
                        .filingNumber(artifact.getFilingNumber()).build())
                .requestInfo(requestInfo).build());

        log.info("finding scheduled hearing for filingNumber: {}", artifact.getFilingNumber());
        Optional<Hearing> scheduledHearing = hearings.stream().filter((hearing) -> SCHEDULED.equalsIgnoreCase(hearing.getStatus())).findFirst();

        Long hearingDate = null;
        if (scheduledHearing.isPresent()) {
            hearingDate = scheduledHearing.get().getStartTime();
        }

        String botd = null;
        Object addDetailsObj = artifact.getAdditionalDetails();
        try {
            Map<String, JsonNode> addDetailsObjMap = new ObjectMapper().convertValue(addDetailsObj, new TypeReference<Map<String, JsonNode>>() {});
            JsonNode botdNode = addDetailsObjMap.get("botd");
            if (botdNode != null) {
                botd = botdNode.asText();
            }
        } catch (IllegalArgumentException e) {
            // additionalDetails is not a Map, so botd remains null
            log.debug("additionalDetails is not a Map, cannot extract botd: {}", e.getMessage());
        }

        log.info("creating case diary entry for filingNumber: {}", artifact.getFilingNumber());

        CaseDiaryEntry caseDiaryEntry = createCaseDiaryEntry(artifact, caseDetails, botd, hearingDate);

        return new ArrayList<>(Collections.singletonList(caseDiaryEntry));

    }

    public CaseDiaryEntry createCaseDiaryEntry(Artifact artifact, JsonNode caseDetails, String botd, Long hearingDate) {
        String cmpNumber = caseDetails.has("cmpNumber") ? (caseDetails.get("cmpNumber").textValue() != null ? caseDetails.get("cmpNumber").textValue() : null) : null;
        String courtCaseNumber = caseDetails.has("courtCaseNumber") ? (caseDetails.get("courtCaseNumber").textValue() != null ? caseDetails.get("courtCaseNumber").textValue() : null) : null;
        String caseId = caseDetails.has("id") ? (caseDetails.get("id").textValue() != null ? caseDetails.get("id").textValue() : null) : null;

        return CaseDiaryEntry.builder()
                .tenantId(artifact.getTenantId())
                .entryDate(dateUtil.getStartOfTheDayForEpoch(dateUtil.getCurrentTimeInMilis()))
                .caseNumber(getCaseReferenceNumber(courtCaseNumber, cmpNumber, artifact.getFilingNumber()))
                .caseId(caseId)
                .courtId(artifact.getCourtId())
                .businessOfDay(botd)
                .referenceId(artifact.getArtifactNumber())
                .referenceType("Documents")
                .hearingDate(hearingDate)
                .additionalDetails(Map.of("filingNumber", artifact.getFilingNumber(),
                        "caseId", caseId))
                .build();
    }

    public String getCaseReferenceNumber(String courtCaseNumber, String cmpNumber, String filingNumber) {
        if (courtCaseNumber != null && !courtCaseNumber.isEmpty()) {
            return courtCaseNumber;
        } else if (cmpNumber != null && !cmpNumber.isEmpty()) {
            return cmpNumber;
        } else {
            return filingNumber;
        }
    }

    private boolean hasNumberSuffix(String tag) {
        if (tag == null || tag.trim().isEmpty()) {
            return false;
        }
        return tag.matches(".*\\d+$");
    }

    private void updateOpenArtifactIndex(EvidenceRequest evidenceRequest) {

        // search for open Artifact
        try {
            Artifact artifact = evidenceRequest.getArtifact();
            RequestInfo requestInfo = evidenceRequest.getRequestInfo();

            OpenArtifact openArtifact = enrichOpenArtifactIndex(artifact, requestInfo);

            if (openArtifact == null) {
                throw new CustomException(ERROR_WHILE_ENRICHING_OPEN_ARTIFACT,
                        "Failed to enrich OPenArtifact with ArtifactNumber: " + artifact.getArtifactNumber());
            }

            try {
                String request = esUtil.buildPayload(openArtifact);
                String uri = config.getEsHostUrl() + config.getBulkPath();
                esUtil.manualIndex(uri, request);
            } catch (Exception e) {
                log.error("Error occurred while updating open Artifact in es");
                log.error("ERROR_FROM_ES: {}", e.getMessage());
            }
    } catch (Exception e) {
            log.error("Something went wrong while updating status of open Artifact with artifactNumber {}", evidenceRequest.getArtifact().getArtifactNumber());
            log.error("ERROR: {}", e.getMessage());
        }

    }

    private OpenArtifact enrichOpenArtifactIndex(Artifact artifact, RequestInfo requestInfo) {
        try {
            log.info("Enriching artifact for filingNumber: {}, tenantId: {}", artifact.getFilingNumber(), artifact.getTenantId());

            CourtCase courtCase = caseUtil.getCase(artifact.getFilingNumber(), artifact.getTenantId(), requestInfo);
            if (courtCase == null) {
                log.error("No CourtCase found for filingNumber: {}, tenantId: {}", artifact.getFilingNumber(), artifact.getTenantId());
                return null;
            }
            String caseNumber = getCaseReferenceNumber(courtCase);
            String caseTitle = courtCase.getCaseTitle();

            Advocate advocate = null;
            try {
                List<AdvocateMapping> representatives = courtCase.getRepresentatives();
                advocate = hearingUtil.getAdvocates(representatives, courtCase.getLitigants(), requestInfo);
                log.info("Advocate enrichment successful: Complainant: {}, Accused: {}", advocate.getComplainant() != null ? advocate.getComplainant() : "No  complainant found", advocate.getAccused() != null ? advocate.getAccused() : "No advocate found");
            } catch (Exception e) {
                log.error("Error while fetching advocate details for caseId: {}", courtCase.getId(), e);
            }



            // Populate searchable fields
            List<String> searchableFields = new ArrayList<>();
            if (caseTitle != null) searchableFields.add(caseTitle);
            if (caseNumber != null) searchableFields.add(caseNumber);
            if (artifact.getArtifactNumber() != null) searchableFields.add(artifact.getArtifactNumber());
            return artifactToOpenArtifact(artifact, caseNumber, caseTitle, advocate, searchableFields);

        } catch (Exception e) {
            log.error("Failed to enrich artifact for filingNumber: {}, tenantId: {}", artifact.getFilingNumber(), artifact.getTenantId(), e);
        }
        return null;
    }

    private String getCaseReferenceNumber(CourtCase courtCase) {
        if (courtCase.getCourtCaseNumber() != null && !courtCase.getCourtCaseNumber().isEmpty()) {
            return courtCase.getCourtCaseNumber();
        } else if (courtCase.getCmpNumber() != null && !courtCase.getCmpNumber().isEmpty()) {
            return courtCase.getCmpNumber();
        } else {
            return courtCase.getFilingNumber();
        }
    }

    public static OpenArtifact artifactToOpenArtifact(Artifact artifact,
                                              String caseNumber,
                                              String caseTitle,
                                              Advocate advocate,
                                              List<String> searchableFields) {

        if (artifact == null) {
            return null;
        }

        return OpenArtifact.builder()
                .id(artifact.getId())
                .tenantId(artifact.getTenantId())
                .artifactNumber(artifact.getArtifactNumber())
                .evidenceNumber(artifact.getEvidenceNumber())
                .filingNumber(artifact.getFilingNumber())
                .externalRefNumber(artifact.getExternalRefNumber())
                .courtId(artifact.getCourtId())
                .caseId(artifact.getCaseId())
                .caseNumber(caseNumber) // enrichment
                .caseTitle(caseTitle)   // enrichment
                .advocate(advocate)     // enrichment
                .application(artifact.getApplication())
                .hearing(artifact.getHearing())
                .order(artifact.getOrder())
                .cnrNumber(artifact.getCnrNumber())
                .mediaType(artifact.getMediaType())
                .artifactType(artifact.getArtifactType())
                .sourceType(artifact.getSourceType())
                .sourceID(artifact.getSourceID())
                .sourceName(artifact.getSourceName())
                .applicableTo(artifact.getApplicableTo())
                .seal(artifact.getSeal())
                .createdDate(artifact.getCreatedDate())
                .publishedDate(artifact.getPublishedDate())
                .isActive(artifact.getIsActive())
                .isEvidence(artifact.getIsEvidence())
                .status(artifact.getStatus())
                .filingType(artifact.getFilingType())
                .isVoid(artifact.getIsVoid())
                .reason(artifact.getReason())
                .file(artifact.getFile())
                .description(artifact.getDescription())
                .artifactDetails(artifact.getArtifactDetails())
                .searchableFields(searchableFields) // enrichment
                .comments(artifact.getComments())
                .additionalDetails(artifact.getAdditionalDetails())
                .auditdetails(artifact.getAuditdetails())
                .workflow(artifact.getWorkflow())
                .shortenedUrl(artifact.getShortenedUrl())
                .witnessMobileNumbers(artifact.getWitnessMobileNumbers())
                .witnessEmails(artifact.getWitnessEmails())
                .tag(artifact.getTag())
                .evidenceMarkedStatus(artifact.getEvidenceMarkedStatus())
                .isEvidenceMarkedFlow(artifact.getIsEvidenceMarkedFlow())
                .build();
    }
}
