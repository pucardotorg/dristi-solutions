package org.pucar.dristi.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Workflow;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.jetbrains.annotations.NotNull;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.enrichment.CaseRegistrationEnrichment;
import org.pucar.dristi.enrichment.EnrichmentService;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.CaseRepository;
import org.pucar.dristi.util.AdvocateUtil;
import org.pucar.dristi.util.BillingUtil;
import org.pucar.dristi.util.EncryptionDecryptionUtil;
import org.pucar.dristi.util.TaskUtil;
import org.pucar.dristi.validators.CaseRegistrationValidator;
import org.pucar.dristi.web.OpenApiCaseSummary;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.analytics.CaseOutcome;
import org.pucar.dristi.web.models.analytics.CaseOverallStatus;
import org.pucar.dristi.web.models.analytics.CaseStageSubStage;
import org.pucar.dristi.web.models.analytics.Outcome;
import org.pucar.dristi.web.models.task.Task;
import org.pucar.dristi.web.models.task.TaskRequest;
import org.pucar.dristi.web.models.task.TaskResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

import static org.pucar.dristi.config.ServiceConstants.*;
import static org.pucar.dristi.enrichment.CaseRegistrationEnrichment.enrichLitigantsOnCreateAndUpdate;
import static org.pucar.dristi.enrichment.CaseRegistrationEnrichment.enrichRepresentativesOnCreateAndUpdate;


@Service
@Slf4j
public class CaseService {

    private final CaseRegistrationValidator validator;
    private final CaseRegistrationEnrichment enrichmentUtil;
    private final CaseRepository caseRepository;
    private final WorkflowService workflowService;
    private final Configuration config;
    private final Producer producer;
    private final BillingUtil billingUtil;
    private final EncryptionDecryptionUtil encryptionDecryptionUtil;
    private final ObjectMapper objectMapper;
    private final CacheService cacheService;

    private final EnrichmentService enrichmentService;

    private final SmsNotificationService notificationService;

    private final IndividualService individualService;

    private final AdvocateUtil advocateUtil;
    private final TaskUtil taskUtil;


    @Autowired
    public CaseService(@Lazy CaseRegistrationValidator validator,
                       CaseRegistrationEnrichment enrichmentUtil,
                       CaseRepository caseRepository,
                       WorkflowService workflowService,
                       Configuration config,
                       Producer producer,
                       TaskUtil taskUtil,
                       BillingUtil billingUtil,
                       EncryptionDecryptionUtil encryptionDecryptionUtil,
                       ObjectMapper objectMapper, CacheService cacheService, EnrichmentService enrichmentService, SmsNotificationService notificationService, IndividualService individualService, AdvocateUtil advocateUtil) {
        this.validator = validator;
        this.enrichmentUtil = enrichmentUtil;
        this.caseRepository = caseRepository;
        this.workflowService = workflowService;
        this.config = config;
        this.producer = producer;
        this.taskUtil = taskUtil;
        this.billingUtil = billingUtil;
        this.encryptionDecryptionUtil = encryptionDecryptionUtil;
        this.objectMapper = objectMapper;
        this.cacheService = cacheService;
        this.enrichmentService = enrichmentService;
        this.notificationService = notificationService;
        this.individualService = individualService;
        this.advocateUtil = advocateUtil;
    }


    public CourtCase createCase(CaseRequest body) {
        try {
            validator.validateCaseRegistration(body);

            enrichmentUtil.enrichCaseRegistrationOnCreate(body);

            workflowService.updateWorkflowStatus(body);

            body.setCases(encryptionDecryptionUtil.encryptObject(body.getCases(), config.getCourtCaseEncrypt(), CourtCase.class));

            cacheService.save(body.getCases().getTenantId() + ":" + body.getCases().getId().toString(), body.getCases());

            producer.push(config.getCaseCreateTopic(), body);

            CourtCase cases = encryptionDecryptionUtil.decryptObject(body.getCases(), config.getCaseDecryptSelf(), CourtCase.class, body.getRequestInfo());
            cases.setAccessCode(null);

            return cases;
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while creating case :: {}", e.toString());
            throw new CustomException(CREATE_CASE_ERR, e.getMessage());
        }
    }

    public void searchCases(CaseSearchRequest caseSearchRequests) {

        try {
            // Fetch applications from database according to the given search criteria

            if (!FLOW_JAC.equals(caseSearchRequests.getFlow()))
                enrichmentUtil.enrichCaseSearchRequest(caseSearchRequests);

            List<CaseCriteria> caseCriteriaList = caseSearchRequests.getCriteria();

            List<CaseCriteria> caseCriteriaInRedis = new ArrayList<>();

            for (CaseCriteria criteria : caseCriteriaList) {
                CourtCase courtCase = null;
                if (!criteria.getDefaultFields() && criteria.getCaseId() != null) {
                    log.info("Searching in redis :: {}", criteria.getCaseId());
                    courtCase = searchRedisCache(caseSearchRequests.getRequestInfo(), criteria.getCaseId());
                }
                if (courtCase != null) {
                    log.info("CourtCase found in Redis cache for caseId: {}", criteria.getCaseId());
                    criteria.setResponseList(Collections.singletonList(courtCase));
                    caseCriteriaInRedis.add(criteria);
                } else {
                    log.debug("CourtCase not found in Redis cache for caseId: {}", criteria.getCaseId());
                }
            }

            if (!caseCriteriaInRedis.isEmpty()) {
                caseCriteriaList.removeAll(caseCriteriaInRedis);
            }
            List<CaseCriteria> casesList = caseRepository.getCases(caseSearchRequests.getCriteria(), caseSearchRequests.getRequestInfo());
            saveInRedisCache(casesList, caseSearchRequests.getRequestInfo());

            casesList.addAll(caseCriteriaInRedis);

            casesList.forEach(caseCriteria -> {
                List<CourtCase> decryptedCourtCases = new ArrayList<>();
                caseCriteria.getResponseList().forEach(cases -> {
                    decryptedCourtCases.add(encryptionDecryptionUtil.decryptObject(cases, config.getCaseDecryptSelf(), CourtCase.class, caseSearchRequests.getRequestInfo()));
                });
                caseCriteria.setResponseList(decryptedCourtCases);
            });

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching to search results :: {}", e.toString());
            throw new CustomException(SEARCH_CASE_ERR, e.getMessage());
        }
    }

    public CourtCase updateCase(CaseRequest caseRequest) {

        try {
            log.info("Method=updateCase,Result=IN_PROGRESS, CaseId={}", caseRequest.getCases().getId());
            //Search and validate case Exist
            List<CaseCriteria> existingApplications = caseRepository.getCases(Collections.singletonList(CaseCriteria.builder().filingNumber(caseRequest.getCases().getFilingNumber()).caseId(String.valueOf(caseRequest.getCases().getId())).cnrNumber(caseRequest.getCases().getCnrNumber()).courtCaseNumber(caseRequest.getCases().getCourtCaseNumber()).build()), caseRequest.getRequestInfo());

            // Validate whether the application that is being requested for update indeed exists
            if (!validator.validateUpdateRequest(caseRequest, existingApplications.get(0).getResponseList())) {
                throw new CustomException(VALIDATION_ERR, "Case Application does not exist");
            }


            // Enrich application upon update
            enrichmentUtil.enrichCaseApplicationUponUpdate(caseRequest, existingApplications.get(0).getResponseList());


            // conditional enrichment using strategy
            enrichmentService.enrichCourtCase(caseRequest);
            String previousStatus = caseRequest.getCases().getStatus();
            workflowService.updateWorkflowStatus(caseRequest);

            // check for last e-sign
            // if its last e-sign update the process instance case will move to pending payment

            Boolean lastSigned = checkItsLastSign(caseRequest);

            if (lastSigned) {
                log.info("Last e-sign for case {}", caseRequest.getCases().getId());
                caseRequest.getRequestInfo().getUserInfo().getRoles().add(Role.builder().id(123L).code(SYSTEM).name(SYSTEM).tenantId(caseRequest.getCases().getTenantId()).build());
                caseRequest.getCases().getWorkflow().setAction(E_SIGN_COMPLETE);
                log.info("Updating workflow status for case {} in last e-sign", caseRequest.getCases().getId());
                workflowService.updateWorkflowStatus(caseRequest);
            }

            checkItsLastResponse(caseRequest);

            if (CASE_ADMIT_STATUS.equals(caseRequest.getCases().getStatus())) {
                enrichmentUtil.enrichCourtCaseNumber(caseRequest);
                caseRequest.getCases().setCaseType(ST);
                producer.push(config.getCaseReferenceUpdateTopic(), createHearingUpdateRequest(caseRequest));
            }

            if (PENDING_ADMISSION_HEARING_STATUS.equals(caseRequest.getCases().getStatus())) {
                enrichmentUtil.enrichAccessCode(caseRequest);
                enrichmentUtil.enrichCNRNumber(caseRequest);
                enrichmentUtil.enrichCMPNumber(caseRequest);
                enrichmentUtil.enrichRegistrationDate(caseRequest);
                caseRequest.getCases().setCaseType(CMP);
                producer.push(config.getCaseReferenceUpdateTopic(), createHearingUpdateRequest(caseRequest));
            }

            log.info("Encrypting case: {}", caseRequest.getCases().getId());
            caseRequest.setCases(encryptionDecryptionUtil.encryptObject(caseRequest.getCases(), config.getCourtCaseEncrypt(), CourtCase.class));

            producer.push(config.getCaseUpdateTopic(), caseRequest);

            log.info("Removing the disabled document, advocate and litigant from the request for case : {}", caseRequest.getCases().getId());
            // filtering document, advocate and their representing party and litigant base on isActive before saving into cache
            List<Document> isActiveTrueDocuments = Optional.ofNullable(caseRequest.getCases().getDocuments()).orElse(Collections.emptyList()).stream().filter(Document::getIsActive).toList();
            List<AdvocateMapping> activeAdvocateMapping = Optional.ofNullable(caseRequest.getCases().getRepresentatives()).orElse(Collections.emptyList()).stream().filter(AdvocateMapping::getIsActive).toList();
            activeAdvocateMapping.forEach(advocateMapping -> {
                if (advocateMapping.getRepresenting() != null) {
                    List<Party> activeRepresenting = advocateMapping.getRepresenting().stream()
                            .filter(Party::getIsActive)
                            .collect(Collectors.toList());
                    advocateMapping.setRepresenting(activeRepresenting);
                }
            });
            List<Party> activeParty = Optional.ofNullable(caseRequest.getCases().getLitigants()).orElse(Collections.emptyList()).stream().filter(Party::getIsActive).toList();
            caseRequest.getCases().setDocuments(isActiveTrueDocuments);
            caseRequest.getCases().setRepresentatives(activeAdvocateMapping);
            caseRequest.getCases().setLitigants(activeParty);

            log.info("Updating the case in redis cache after filtering the documents, advocates and litigants : {}", caseRequest.getCases().getId());

            cacheService.save(caseRequest.getCases().getTenantId() + ":" + caseRequest.getCases().getId(), caseRequest.getCases());

            CourtCase cases = encryptionDecryptionUtil.decryptObject(caseRequest.getCases(), null, CourtCase.class, caseRequest.getRequestInfo());
            cases.setAccessCode(null);
            String updatedStatus = caseRequest.getCases().getStatus();
            String messageCode = getNotificationStatus(previousStatus, updatedStatus);
            if (messageCode != null) {
                String[] messageCodes = messageCode.split(",");
                for (String msgCode : messageCodes) {
                    callNotificationService(caseRequest, msgCode);
                }
            }

            log.info("Method=updateCase,Result=SUCCESS, CaseId={}", caseRequest.getCases().getId());

            return cases;

        } catch (Exception e) {
            log.error("Method=updateCase,Result=FAILURE, CaseId={}", caseRequest.getCases().getId());
            log.error("Error occurred while updating case :: {}", e.toString());
            throw new CustomException(UPDATE_CASE_ERR, "Exception occurred while updating case: " + e.getMessage());
        }

    }

    private Object createHearingUpdateRequest(CaseRequest caseRequest) {
        Map<String, Object> hearingUpdateRequest = new HashMap<>();
        hearingUpdateRequest.put("requestInfo", caseRequest.getRequestInfo());
        hearingUpdateRequest.put("filingNumber", caseRequest.getCases().getFilingNumber());
        hearingUpdateRequest.put("cmpNumber", caseRequest.getCases().getCmpNumber());
        hearingUpdateRequest.put("courtCaseNumber", caseRequest.getCases().getCourtCaseNumber());
        hearingUpdateRequest.put("tenantId", caseRequest.getCases().getTenantId());
        return hearingUpdateRequest;
    }

    private Boolean checkItsLastSign(CaseRequest caseRequest) {

        if (E_SIGN.equalsIgnoreCase(caseRequest.getCases().getWorkflow().getAction())) {

            log.info("Method=checkItsLastSign, Result= IN_ProgressChecking if its last e-sign for case {}", caseRequest.getCases().getId());

            CourtCase cases = caseRequest.getCases();
            // Check if all litigants have signed
            boolean allLitigantsHaveSigned = cases.getLitigants().stream().filter(Party::getIsActive).allMatch(Party::getHasSigned);

            // If any litigant hasn't signed, return false immediately
            if (!allLitigantsHaveSigned) {
                log.info("Not all litigants have signed for case {}", cases.getId());
                return false;
            }

            // Create a map of litigant IDs to their respective representatives
            log.info("Generating a litigant-representative map for case {} ", cases.getId());
            // add null check here if representative is null then there should not be stream
            Map<String, List<AdvocateMapping>> representativesMap = Optional.ofNullable(cases.getRepresentatives()).orElse(Collections.emptyList()).stream().filter(AdvocateMapping::getIsActive).flatMap(rep -> rep.getRepresenting().stream().map(Party::getIndividualId)  // Get the ID of each litigant represented by this advocate
                            .filter(Objects::nonNull)  // Ensure no null IDs
                            .map(litigantId -> new AbstractMap.SimpleEntry<>(litigantId, rep)))  // Create entries with litigant ID and the rep
                    .collect(Collectors.groupingBy(Map.Entry::getKey, // Group by litigant ID
                            Collectors.mapping(Map.Entry::getValue, Collectors.toList())));

            log.info("Generated a litigant-representative map for case {} with size {} ", cases.getId(), representativesMap.size());

            // Check if each active litigant  has a at least one signed representative
            // Find the list of representatives for the current litigant
            // If no representatives exist, the litigant's signature is enough
            // If representatives exist, at least one must have signed

            return cases.getLitigants().stream().filter(Party::getIsActive).allMatch(litigant -> {
                String litigantId = litigant.getIndividualId();

                // Find the list of representatives for the current litigant
                List<AdvocateMapping> representatives = representativesMap.get(litigantId);

                // If no representatives exist, the litigant's signature is enough
                if (representatives == null || representatives.isEmpty()) {
                    log.info("Litigant {} has no representatives", litigantId);
                    return true;
                }
                log.info("Litigant {} has representatives {}", litigantId, representatives.size());


                // If representatives exist, at least one must have signed
                return representatives.stream().anyMatch(AdvocateMapping::getHasSigned);
            });
        }
        log.info("Method=checkItsLastSign, Result= SUCCESS, Not last e-sign for case {}", caseRequest.getCases().getId());
        return false;
    }

    private void checkItsLastResponse(CaseRequest caseRequest) {
        if (RESPOND.equalsIgnoreCase(caseRequest.getCases().getWorkflow().getAction())) {

            log.info("Method=checkItsLastResponse, Result= IN_ProgressChecking if its last response by accused advocates {}", caseRequest.getCases().getId());

            CourtCase cases = caseRequest.getCases();

            int noOfAccused = getNoOfAccused(cases.getAdditionalDetails());
            log.info("No of Accused :: {}", noOfAccused);

            List<Party> noOfAccusedJoined = Optional.ofNullable(cases.getLitigants()).orElse(Collections.emptyList()).stream()
                    .filter(party -> party.getIsActive() && party.getPartyType().contains(ACCUSED_PARTY_TYPE)).toList();

            log.info("No of accused joined :: {}", noOfAccusedJoined.size());
            if (noOfAccusedJoined.size() != noOfAccused) {
                return;
            }

            for (Party party : noOfAccusedJoined) {
                if (party.getIsActive() && party.getIsResponseRequired()) {
                    log.info("Checking if accused with individualId :: {} has submitted response", party.getIndividualId());

                    boolean hasThisAccusedSubmittedResponse = false;

                    for (Document document : Optional.ofNullable(party.getDocuments()).orElse(Collections.emptyList())) {
                        ObjectNode additionalDetails = objectMapper.convertValue(document.getAdditionalDetails(), ObjectNode.class);

                        if (additionalDetails.has(FILE_TYPE)) {
                            String fileType = additionalDetails.get(FILE_TYPE).asText();
                            if (StringUtils.equalsIgnoreCase(RESPONDENT_RESPONSE, fileType)) {
                                log.info("Party with individualId :: {} has submitted response", party.getIndividualId());
                                hasThisAccusedSubmittedResponse = true;
                                break;
                            }
                        }
                    }

                    if (!hasThisAccusedSubmittedResponse) {
                        log.info("Party with individualId :: {} has not submitted response", party.getIndividualId());
                        return;
                    }
                }
            }

            log.info("Last response submitted by accused for case {}", caseRequest.getCases().getId());
            caseRequest.getRequestInfo().getUserInfo().getRoles().add(Role.builder().id(123L).code(SYSTEM).name(SYSTEM).tenantId(caseRequest.getCases().getTenantId()).build());
            caseRequest.getCases().getWorkflow().setAction(RESPONSE_COMPLETE);
            log.info("Updating workflow status for case {} in last response submission", caseRequest.getCases().getId());
            workflowService.updateWorkflowStatus(caseRequest);
        }
    }

    private int getNoOfAccused(Object additionalDetails) {
        int noOfAccused = 0;
        ObjectNode detailsNode = objectMapper.convertValue(additionalDetails, ObjectNode.class);

        if (detailsNode.has("respondentDetails")) {
            ObjectNode respondentDetails = (ObjectNode) detailsNode.get("respondentDetails");

            if (respondentDetails.has("formdata") && respondentDetails.get("formdata").isArray()) {
                ArrayNode formData = (ArrayNode) respondentDetails.get("formdata");
                noOfAccused = formData.size();
            }
        }
        return noOfAccused;
    }

    public CourtCase editCase(CaseRequest caseRequest) {

        try {
            validator.validateEditCase(caseRequest);

            CourtCase courtCase = searchRedisCache(caseRequest.getRequestInfo(), String.valueOf(caseRequest.getCases().getId()));

            if (courtCase == null) {
                log.debug("CourtCase not found in Redis cache for caseId :: {}", caseRequest.getCases().getId());
                List<CaseCriteria> existingApplications = caseRepository.getCases(Collections.singletonList(CaseCriteria.builder().caseId(String.valueOf(caseRequest.getCases().getId())).build()), caseRequest.getRequestInfo());

                if (existingApplications.get(0).getResponseList().isEmpty()) {
                    log.debug("CourtCase not found in DB for caseId :: {}", caseRequest.getCases().getId());
                    throw new CustomException(VALIDATION_ERR, "Case Application does not exist");
                } else {
                    courtCase = existingApplications.get(0).getResponseList().get(0);
                }
            }

            CourtCase decryptedCourtCase = encryptionDecryptionUtil.decryptObject(courtCase, config.getCaseDecryptSelf(), CourtCase.class, caseRequest.getRequestInfo());

            AuditDetails auditDetails = courtCase.getAuditdetails();
            auditDetails.setLastModifiedTime(System.currentTimeMillis());
            auditDetails.setLastModifiedBy(caseRequest.getRequestInfo().getUserInfo().getUuid());

            decryptedCourtCase.setAdditionalDetails(caseRequest.getCases().getAdditionalDetails());
            decryptedCourtCase.setCaseTitle(caseRequest.getCases().getCaseTitle());
            decryptedCourtCase.setAuditdetails(auditDetails);

            caseRequest.setCases(decryptedCourtCase);

            log.info("Encrypting :: {}", caseRequest);

            caseRequest.setCases(encryptionDecryptionUtil.encryptObject(caseRequest.getCases(), config.getCourtCaseEncryptNew(), CourtCase.class));
            cacheService.save(caseRequest.getCases().getTenantId() + ":" + caseRequest.getCases().getId(), caseRequest.getCases());

            producer.push(config.getCaseEditTopic(), caseRequest);

            CourtCase cases = encryptionDecryptionUtil.decryptObject(caseRequest.getCases(), null, CourtCase.class, caseRequest.getRequestInfo());
            cases.setAccessCode(null);

            return cases;


        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while editing case :: {}", e.toString());
            throw new CustomException(EDIT_CASE_ERR, "Exception occurred while editing case: " + e.getMessage());
        }

    }

    public CourtCase createEditProfileRequest(CreateProfileRequest profileRequest) {

        try {
            log.debug("Inside create edit profile request");

            CourtCase courtCase = searchRedisCache(profileRequest.getRequestInfo(), String.valueOf(profileRequest.getProfile().getCaseId()));

            if (courtCase == null) {
                log.debug("CourtCase not found in Redis cache for caseId :: {}", profileRequest.getProfile().getCaseId());
                List<CaseCriteria> existingApplications = caseRepository.getCases(Collections.singletonList(CaseCriteria.builder().caseId(profileRequest.getProfile().getCaseId()).build()), profileRequest.getRequestInfo());

                if (existingApplications.get(0).getResponseList().isEmpty()) {
                    log.debug("CourtCase not found in DB for caseId :: {}", profileRequest.getProfile().getCaseId());
                    throw new CustomException(VALIDATION_ERR, "Case Application does not exist");
                } else {
                    courtCase = existingApplications.get(0).getResponseList().get(0);
                }
            }
            validator.validateProfileEdit(profileRequest, courtCase);

            CourtCase decryptedCourtCase = encryptionDecryptionUtil.decryptObject(courtCase, config.getCaseDecryptSelf(), CourtCase.class, profileRequest.getRequestInfo());

            CaseRequest caseRequest = CaseRequest.builder()
                    .requestInfo(profileRequest.getRequestInfo())
                    .cases(decryptedCourtCase)
                    .build();
            AuditDetails auditDetails = courtCase.getAuditdetails();
            auditDetails.setLastModifiedTime(System.currentTimeMillis());
            auditDetails.setLastModifiedBy(caseRequest.getRequestInfo().getUserInfo().getUuid());

            updateAdditionalDetails(decryptedCourtCase, profileRequest.getProfile());
            decryptedCourtCase.setAdditionalDetails(caseRequest.getCases().getAdditionalDetails());
            decryptedCourtCase.setCaseTitle(caseRequest.getCases().getCaseTitle());
            decryptedCourtCase.setAuditdetails(auditDetails);

            caseRequest.setCases(decryptedCourtCase);

            log.info("Encrypting profile edit for caseId: {}", caseRequest.getCases().getId());

            caseRequest.setCases(encryptionDecryptionUtil.encryptObject(caseRequest.getCases(), config.getCourtCaseEncrypt(), CourtCase.class));
            cacheService.save(caseRequest.getCases().getTenantId() + ":" + caseRequest.getCases().getId(), caseRequest.getCases());

            producer.push(config.getCaseUpdateTopic(), caseRequest);

            CourtCase cases = encryptionDecryptionUtil.decryptObject(caseRequest.getCases(), null, CourtCase.class, caseRequest.getRequestInfo());
            cases.setAccessCode(null);

            return cases;


        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while editing profile :: {}", e.toString());
            throw new CustomException(EDIT_CASE_ERR, "Exception occurred while editing profile: " + e.getMessage());
        }

    }

    private void updateAdditionalDetails(CourtCase decryptedCourtCase, Profile profile) {
        if (decryptedCourtCase == null || profile == null) {
            throw new IllegalArgumentException("CourtCase and Profile cannot be null");
        }

        Object additionalDetailsMap = decryptedCourtCase.getAdditionalDetails();

        JsonNode additionalDetailsNode = objectMapper.valueToTree(additionalDetailsMap);
        JsonNode profileRequestsNode = additionalDetailsNode.get("profileRequests");

        ArrayNode profileRequestsArray;
        if (profileRequestsNode == null || !profileRequestsNode.isArray()) {
            profileRequestsArray = objectMapper.createArrayNode();
        } else {
            profileRequestsArray = (ArrayNode) profileRequestsNode;
        }

        profile.setId(UUID.randomUUID().toString());
        JsonNode newProfileNode = objectMapper.valueToTree(profile);
        profileRequestsArray.add(newProfileNode);

        ((ObjectNode) additionalDetailsNode).set("profileRequests", profileRequestsArray);
        decryptedCourtCase.setAdditionalDetails(objectMapper.convertValue(additionalDetailsNode, Map.class));
    }


    public void callNotificationService(CaseRequest caseRequest, String messageCode) {
        try {
            CourtCase courtCase = caseRequest.getCases();
            Set<String> IndividualIds = getLitigantIndividualId(courtCase);
            getAdvocateIndividualId(caseRequest, IndividualIds);
            Set<String> phonenumbers = callIndividualService(caseRequest.getRequestInfo(), IndividualIds);
            SmsTemplateData smsTemplateData = enrichSmsTemplateData(caseRequest.getCases());
            for (String number : phonenumbers) {
                notificationService.sendNotification(caseRequest.getRequestInfo(), smsTemplateData, messageCode, number);
            }
        } catch (Exception e) {
            // Log the exception and continue the execution without throwing
            log.error("Error occurred while sending notification: {}", e.toString());
        }
    }

    private void getAdvocateIndividualId(CaseRequest caseRequest, Set<String> individualIds) {

        Set<String> advocateId = new HashSet<>();
        CourtCase courtCase = caseRequest.getCases();
        if (courtCase.getRepresentatives() != null) {
            advocateId.addAll(
                    courtCase.getRepresentatives().stream()
                            .filter(AdvocateMapping::getIsActive)
                            .map(AdvocateMapping::getAdvocateId)
                            .collect(Collectors.toSet())
            );
        }
        if (!advocateId.isEmpty()) {
            advocateId = advocateUtil.getAdvocate(caseRequest.getRequestInfo(), advocateId.stream().toList());
        }
        individualIds.addAll(advocateId);
    }

    private Set<String> getLitigantIndividualId(CourtCase courtCase) {
        Set<String> ids = new HashSet<>();

        if (courtCase.getLitigants() != null) {
            ids.addAll(
                    courtCase.getLitigants().stream()
                            .filter(Party::getIsActive)
                            .map(Party::getIndividualId)
                            .collect(Collectors.toSet())
            );
        }
        return ids;
    }

    private Set<String> callIndividualService(RequestInfo requestInfo, Set<String> individualIds) {

        Set<String> mobileNumber = new HashSet<>();
        try {
            for (String id : individualIds) {
                List<Individual> individuals = individualService.getIndividualsByIndividualId(requestInfo, id);
                if (individuals != null && individuals.get(0).getMobileNumber() != null) {
                    mobileNumber.add(individuals.get(0).getMobileNumber());
                }
            }
        } catch (Exception e) {
            // Log the exception and continue the execution without throwing
            log.error("Error occurred while sending notification: {}", e.toString());
        }

        return mobileNumber;
    }

//    public void callNotificationService(CaseRequest caseRequest, String messageCode) {
//        try {
//            CourtCase courtCase = caseRequest.getCases();
//            Object additionalDetailsObject = courtCase.getAdditionalDetails();
//            String jsonData = objectMapper.writeValueAsString(additionalDetailsObject);
//            JsonNode rootNode = objectMapper.readTree(jsonData);
//
//            List<String> individualIds = extractIndividualIds(rootNode);
//
//            List<String> phonenumbers = callIndividualService(caseRequest.getRequestInfo(), individualIds);
//            SmsTemplateData smsTemplateData = enrichSmsTemplateData(caseRequest.getCases());
//            for (String number : phonenumbers) {
//                notificationService.sendNotification(caseRequest.getRequestInfo(), smsTemplateData, messageCode, number);
//            }
//        } catch (Exception e) {
//            // Log the exception and continue the execution without throwing
//            log.error("Error occurred while sending notification: {}", e.toString());
//        }
//    }

    private SmsTemplateData enrichSmsTemplateData(CourtCase cases) {
        return SmsTemplateData.builder()
                .courtCaseNumber(cases.getCourtCaseNumber())
                .cnrNumber(cases.getCnrNumber())
                .cmpNumber(cases.getCmpNumber())
                .efilingNumber(cases.getFilingNumber())
                .tenantId(cases.getTenantId()).build();
    }

    private List<String> callIndividualService(RequestInfo requestInfo, List<String> individualIds) {

        List<String> mobileNumber = new ArrayList<>();
        try {
            for (String id : individualIds) {
                List<Individual> individuals = individualService.getIndividualsByIndividualId(requestInfo, id);
                if (individuals != null && individuals.get(0).getMobileNumber() != null) {
                    mobileNumber.add(individuals.get(0).getMobileNumber());
                }
            }
        } catch (Exception e) {
            // Log the exception and continue the execution without throwing
            log.error("Error occurred while sending notification: {}", e.toString());
        }

        return mobileNumber;
    }

    public static List<String> extractIndividualIds(JsonNode rootNode) {
        List<String> individualIds = new ArrayList<>();


        JsonNode complainantDetailsNode = rootNode.path("complainantDetails")
                .path("formdata");
        if (complainantDetailsNode.isArray()) {
            for (JsonNode complainantNode : complainantDetailsNode) {
                JsonNode complainantVerificationNode = complainantNode.path("data")
                        .path("complainantVerification")
                        .path("individualDetails");
                if (!complainantVerificationNode.isMissingNode()) {
                    String individualId = complainantVerificationNode.path("individualId").asText();
                    if (!individualId.isEmpty()) {
                        individualIds.add(individualId);
                    }
                }
            }
        }

        JsonNode respondentDetailsNode = rootNode.path("respondentDetails")
                .path("formdata");
        if (respondentDetailsNode.isArray()) {
            for (JsonNode respondentNode : respondentDetailsNode) {
                JsonNode respondentVerificationNode = respondentNode.path("data")
                        .path("respondentVerification")
                        .path("individualDetails");
                if (!respondentVerificationNode.isMissingNode()) {
                    String individualId = respondentVerificationNode.path("individualId").asText();
                    if (!individualId.isEmpty()) {
                        individualIds.add(individualId);
                    }
                }
            }
        }

        JsonNode advocateDetailsNode = rootNode.path("advocateDetails")
                .path("formdata");
        if (advocateDetailsNode.isArray()) {
            for (JsonNode advocateNode : advocateDetailsNode) {
                // Check if the advocate is representing
                JsonNode isAdvocateRepresentingNode = advocateNode.path("data")
                        .path("isAdvocateRepresenting")
                        .path("code");

                // Proceed if the value is "YES"
                if ("YES".equals(isAdvocateRepresentingNode.asText())) {
                    JsonNode advocateListNode = advocateNode.path("data")
                            .path("advocateBarRegNumberWithName");

                    if (advocateListNode.isArray()) {
                        for (JsonNode advocateInfoNode : advocateListNode) {
                            String individualId = advocateInfoNode.path("individualId").asText();
                            if (!individualId.isEmpty()) {
                                individualIds.add(individualId);
                            }
                        }
                    }
                }
            }
        }

        return individualIds;
    }

    private String getNotificationStatus(String previousStatus, String updatedStatus) {
        if (updatedStatus.equalsIgnoreCase(PENDING_E_SIGN)) {
            return ESIGN_PENDING;
        } else if (updatedStatus.equalsIgnoreCase(PAYMENT_PENDING)) {
            return CASE_SUBMITTED;
        } else if (previousStatus.equalsIgnoreCase(UNDER_SCRUTINY) && updatedStatus.equalsIgnoreCase(PENDING_REGISTRATION)) {
            return CASE_FORWARDED_TO_JUDGE;
        } else if (previousStatus.equalsIgnoreCase(UNDER_SCRUTINY) && updatedStatus.equalsIgnoreCase(CASE_REASSIGNED)) {
            return FSO_SEND_BACK;
        } else if (previousStatus.equalsIgnoreCase(PENDING_REGISTRATION) && updatedStatus.equalsIgnoreCase(PENDING_ADMISSION_HEARING)) {
            return CASE_REGISTERED;
        } else if (previousStatus.equalsIgnoreCase(PENDING_REGISTRATION) && updatedStatus.equalsIgnoreCase(CASE_REASSIGNED)) {
            return JUDGE_SEND_BACK_E_SIGN_CODE;
        } else if (previousStatus.equalsIgnoreCase(PENDING_ADMISSION_HEARING) && updatedStatus.equalsIgnoreCase(ADMISSION_HEARING_SCHEDULED)) {
            return ADMISSION_HEARING_SCHEDULED;
        } else if (previousStatus.equalsIgnoreCase(PENDING_RESPONSE) && updatedStatus.equalsIgnoreCase(CASE_ADMITTED)) {
            return CASE_ADMITTED;
        }
        return null;
    }

    public List<CaseExists> existCases(CaseExistsRequest caseExistsRequest) {
        try {
            // Fetch applications from database according to the given search criteria
            return caseRepository.checkCaseExists(caseExistsRequest.getCriteria());
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching to exist case :: {}", e.toString());
            throw new CustomException(CASE_EXIST_ERR, e.getMessage());
        }
    }

    public void updateCourtCaseInRedis(String tenantId, CourtCase courtCase) {
        if (tenantId == null || courtCase == null) {
            throw new CustomException("INVALID_INPUT", "Tenant ID or CourtCase is null");
        }
        cacheService.save(tenantId + ":" + courtCase.getId().toString(), courtCase);
    }

    public AddWitnessResponse addWitness(AddWitnessRequest addWitnessRequest) {

        try {
            RequestInfo requestInfo = addWitnessRequest.getRequestInfo();
            String filingNumber = addWitnessRequest.getCaseFilingNumber();
            CaseCriteria caseCriteria = CaseCriteria.builder().filingNumber(filingNumber).build();
            List<CaseCriteria> existingApplications = caseRepository.getCases(Collections.singletonList(caseCriteria), requestInfo);

            if (existingApplications.isEmpty()) {
                throw new CustomException(INVALID_CASE, "No case found for the given filing Number");
            }
            List<CourtCase> courtCaseList = existingApplications.get(0).getResponseList();
            if (courtCaseList.isEmpty()) {
                throw new CustomException(INVALID_CASE, "No case found for the given filing Number");
            }

            if (addWitnessRequest.getAdditionalDetails() == null)
                throw new CustomException(VALIDATION_ERR, "Additional details are required");


            User userInfo = requestInfo.getUserInfo();
            String userType = userInfo.getType();
            if (!EMPLOYEE.equalsIgnoreCase(userType) || userInfo.getRoles().stream().filter(role -> EMPLOYEE.equalsIgnoreCase(role.getName())).findFirst().isEmpty())
                throw new CustomException(VALIDATION_ERR, "Not a valid user to add witness details");

            AuditDetails auditDetails = AuditDetails
                    .builder()
                    .lastModifiedBy(addWitnessRequest.getRequestInfo().getUserInfo().getUuid())
                    .lastModifiedTime(System.currentTimeMillis())
                    .build();
            addWitnessRequest.setAuditDetails(auditDetails);

            CourtCase caseObj = CourtCase.builder()
                    .filingNumber(filingNumber)
                    .build();

            caseObj.setAdditionalDetails(addWitnessRequest.getAdditionalDetails());
            caseObj = encryptionDecryptionUtil.encryptObject(caseObj, config.getCourtCaseEncrypt(), CourtCase.class);

            addWitnessRequest.setAdditionalDetails(caseObj.getAdditionalDetails());
            producer.push(config.getAdditionalJoinCaseTopic(), addWitnessRequest);

            CourtCase courtCase = courtCaseList.get(0);
            if (courtCase != null) {
                courtCase.setAdditionalDetails(addWitnessRequest.getAdditionalDetails());
                updateCourtCaseInRedis(addWitnessRequest.getRequestInfo().getUserInfo().getTenantId(), courtCase);
            }

            publishToJoinCaseIndexer(addWitnessRequest.getRequestInfo(), courtCase);

            caseObj = encryptionDecryptionUtil.decryptObject(caseObj, config.getCaseDecryptSelf(), CourtCase.class, addWitnessRequest.getRequestInfo());
            addWitnessRequest.setAdditionalDetails(caseObj.getAdditionalDetails());

            if (courtCase != null) {
                smsForNewWitnessAddition(courtCase, addWitnessRequest);
                smsForOthersAsWitnessAdded(courtCase, addWitnessRequest);
            }
            return AddWitnessResponse.builder().addWitnessRequest(addWitnessRequest).build();

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while adding witness to the case :: {}", e.toString());
            throw new CustomException(ADD_WITNESS_TO_CASE_ERR, "Exception occurred while adding witness to case: " + e.getMessage());
        }

    }


    private void verifyAndEnrichLitigant(JoinCaseRequest joinCaseRequest, CourtCase courtCase, CourtCase caseObj, AuditDetails auditDetails) {
        log.info("enriching litigants");
        enrichLitigantsOnCreateAndUpdate(caseObj, auditDetails);

        log.info("Pushing join case litigant details :: {}", joinCaseRequest.getLitigant());
        producer.push(config.getLitigantJoinCaseTopic(), joinCaseRequest);

        String tenantId = joinCaseRequest.getRequestInfo().getUserInfo().getTenantId();

        if (courtCase.getLitigants() != null) {
            List<Party> litigants = courtCase.getLitigants();
            litigants.addAll(joinCaseRequest.getLitigant());
        } else {
            courtCase.setLitigants(joinCaseRequest.getLitigant());
        }

        if (joinCaseRequest.getAdditionalDetails() != null) {
            log.info("EnrichLitigant, Additional details :: {}", joinCaseRequest.getAdditionalDetails());
            caseObj.setAdditionalDetails(editRespondantDetails(joinCaseRequest.getAdditionalDetails(), courtCase.getAdditionalDetails(), joinCaseRequest.getLitigant(), joinCaseRequest.getIsLitigantPIP()));
            courtCase.setAdditionalDetails(caseObj.getAdditionalDetails());
            caseObj = encryptionDecryptionUtil.encryptObject(caseObj, config.getCourtCaseEncrypt(), CourtCase.class);
            courtCase = encryptionDecryptionUtil.encryptObject(courtCase, config.getCourtCaseEncrypt(), CourtCase.class);
            joinCaseRequest.setAdditionalDetails(caseObj.getAdditionalDetails());

            log.info("EnrichLitigant,Pushing additional details :: {}", joinCaseRequest.getAdditionalDetails());
            producer.push(config.getAdditionalJoinCaseTopic(), joinCaseRequest);

            courtCase.setAdditionalDetails(joinCaseRequest.getAdditionalDetails());
            updateCourtCaseInRedis(tenantId, courtCase);

            caseObj.setAuditdetails(courtCase.getAuditdetails());
            caseObj = encryptionDecryptionUtil.decryptObject(caseObj, config.getCaseDecryptSelf(), CourtCase.class, joinCaseRequest.getRequestInfo());
            courtCase = encryptionDecryptionUtil.decryptObject(courtCase, config.getCaseDecryptSelf(), CourtCase.class, joinCaseRequest.getRequestInfo());
            joinCaseRequest.setAdditionalDetails(caseObj.getAdditionalDetails());
            courtCase.setAdditionalDetails(joinCaseRequest.getAdditionalDetails());
        } else {
            CourtCase encryptedCourtCase = encryptionDecryptionUtil.encryptObject(courtCase, config.getCourtCaseEncrypt(), CourtCase.class);
            updateCourtCaseInRedis(tenantId, encryptedCourtCase);
        }

        publishToJoinCaseIndexer(joinCaseRequest.getRequestInfo(), courtCase);
    }

    private void verifyAndEnrichRepresentative(JoinCaseRequest joinCaseRequest, CourtCase courtCase, CourtCase caseObj, AuditDetails auditDetails) {
        log.info("enriching representatives");
        enrichRepresentativesOnCreateAndUpdate(caseObj, auditDetails);

        joinCaseRequest.setRepresentative(mapAdvocateMappingToRepresentative(caseObj.getRepresentatives().get(0)));
        log.info("Pushing join case representative details :: {}", joinCaseRequest.getRepresentative());
        producer.push(config.getRepresentativeJoinCaseTopic(), joinCaseRequest);

        String tenantId = joinCaseRequest.getRequestInfo().getUserInfo().getTenantId();

        if (courtCase.getRepresentatives() != null) {
            List<AdvocateMapping> representatives = courtCase.getRepresentatives();
            representatives.add(mapRepresentativeToAdvocateMapping(joinCaseRequest.getRepresentative()));
        } else {
            courtCase.setRepresentatives(Collections.singletonList(mapRepresentativeToAdvocateMapping(joinCaseRequest.getRepresentative())));
        }

        Object additionalDetails = joinCaseRequest.getAdditionalDetails();
        if (joinCaseRequest.getAdditionalDetails() != null) {
            log.info("EnrichRepresentative, additional details :: {}", joinCaseRequest.getAdditionalDetails());
            caseObj.setAdditionalDetails(editAdvocateDetails(joinCaseRequest.getAdditionalDetails(), courtCase.getAdditionalDetails()));
            caseObj = encryptionDecryptionUtil.encryptObject(caseObj, config.getCourtCaseEncrypt(), CourtCase.class);
            courtCase = encryptionDecryptionUtil.encryptObject(courtCase, config.getCourtCaseEncrypt(), CourtCase.class);
            joinCaseRequest.setAdditionalDetails(caseObj.getAdditionalDetails());
            log.info("EnrichRepresentative,Pushing additional details :: {}", joinCaseRequest.getAdditionalDetails());
            producer.push(config.getAdditionalJoinCaseTopic(), joinCaseRequest);

            courtCase.setAdditionalDetails(joinCaseRequest.getAdditionalDetails());

            updateCourtCaseInRedis(tenantId, courtCase);

            caseObj.setAuditdetails(courtCase.getAuditdetails());
            caseObj = encryptionDecryptionUtil.decryptObject(caseObj, config.getCaseDecryptSelf(), CourtCase.class, joinCaseRequest.getRequestInfo());
            joinCaseRequest.setAdditionalDetails(caseObj.getAdditionalDetails());
        } else {
            CourtCase encryptedCourtCase = encryptionDecryptionUtil.encryptObject(courtCase, config.getCourtCaseEncrypt(), CourtCase.class);
            updateCourtCaseInRedis(tenantId, encryptedCourtCase);
        }

        publishToJoinCaseIndexer(joinCaseRequest.getRequestInfo(), courtCase);

        joinCaseRequest.setAdditionalDetails(additionalDetails);
    }

    public JoinCaseResponse verifyJoinCaseRequest(JoinCaseRequest joinCaseRequest, Boolean isPaymentCompleted) {
        try {
            String filingNumber = joinCaseRequest.getCaseFilingNumber();
            List<CaseCriteria> existingApplications = caseRepository.getCases(Collections.singletonList(CaseCriteria.builder().filingNumber(filingNumber).build()), joinCaseRequest.getRequestInfo());
            log.info("Existing application list :: {}", existingApplications.size());
            CourtCase courtCase = validateAccessCodeAndReturnCourtCase(joinCaseRequest, existingApplications);
            UUID caseId = courtCase.getId();


            AuditDetails auditDetails = AuditDetails.builder()
                    .createdBy(joinCaseRequest.getRequestInfo().getUserInfo().getUuid())
                    .createdTime(System.currentTimeMillis())
                    .lastModifiedBy(joinCaseRequest.getRequestInfo().getUserInfo().getUuid())
                    .lastModifiedTime(System.currentTimeMillis()).build();
            joinCaseRequest.setAuditDetails(auditDetails);

            CourtCase caseObj = CourtCase.builder()
                    .id(caseId)
                    .build();

            // Stream over the litigants to create a list of individualIds
            List<String> individualIds = Optional.ofNullable(courtCase.getLitigants())
                    .orElse(Collections.emptyList())
                    .stream()
                    .map(Party::getIndividualId)
                    .toList();

            //For litigant join case
            if (joinCaseRequest.getLitigant() != null && !joinCaseRequest.getLitigant().isEmpty() && joinCaseRequest.getRepresentative() == null) {
                //litigant join case validation

                if (!validator.canLitigantJoinCase(joinCaseRequest))
                    throw new CustomException(VALIDATION_ERR, JOIN_CASE_INVALID_REQUEST);

                for (Party litigant : joinCaseRequest.getLitigant()) {
                    if (litigant.getIndividualId() != null && individualIds.contains(litigant.getIndividualId()) && !joinCaseRequest.getIsLitigantPIP()) {
                        throw new CustomException(VALIDATION_ERR, "Litigant is already a part of the given case");
                    }
                }

                verifyLitigantsAndJoinCase(joinCaseRequest, courtCase, caseObj, auditDetails);

            }

            //For advocate join case
            if (joinCaseRequest.getRepresentative() != null) {

                //advocate join case validation
                if (!validator.canRepresentativeJoinCase(joinCaseRequest))
                    throw new CustomException(VALIDATION_ERR, JOIN_CASE_INVALID_REQUEST);

                if (joinCaseRequest.getLitigant() != null && !joinCaseRequest.getLitigant().isEmpty()) {
                    if (!validator.canLitigantJoinCase(joinCaseRequest))
                        throw new CustomException(VALIDATION_ERR, JOIN_CASE_INVALID_REQUEST);
                }

                // Stream over the representatives to create a list of advocateIds
                List<String> advocateIds = Optional.ofNullable(courtCase.getRepresentatives())
                        .orElse(Collections.emptyList())
                        .stream()
                        .map(AdvocateMapping::getAdvocateId)
                        .toList();
                AdvocateMapping existingRepresentative = null;

                // If advocate is already representing the individual and not replacing other advocate throw exception
                if (!advocateIds.isEmpty() && joinCaseRequest.getRepresentative().getAdvocateId() != null && advocateIds.contains(joinCaseRequest.getRepresentative().getAdvocateId())) {

                    Optional<AdvocateMapping> existingRepresentativeOptional = courtCase.getRepresentatives().stream()
                            .filter(advocateMapping -> joinCaseRequest.getRepresentative().getAdvocateId().equals(advocateMapping.getAdvocateId()))
                            .findFirst();

                    if (existingRepresentativeOptional.isEmpty())
                        throw new CustomException(INVALID_ADVOCATE_ID, INVALID_ADVOCATE_DETAILS);

                    existingRepresentative = existingRepresentativeOptional.get();
                    List<String> individualIdList = existingRepresentative.getRepresenting().stream()
                            .map(Party::getIndividualId)
                            .toList();

                    List<Party> partyList = existingRepresentative.getRepresenting();

                    joinCaseRequest.getRepresentative().getRepresenting().forEach(representing -> {
                        if (individualIdList.contains(representing.getIndividualId()) && !representing.getIsAdvocateReplacing()) {
                            log.info("Advocate is already representing the individual");
                            throw new CustomException(VALIDATION_ERR, "Advocate is already representing the individual");
                        } else if (individualIdList.contains(representing.getIndividualId()) && representing.getIsAdvocateReplacing()) {
                            log.info("Advocate is already representing the individual and isAdvocateReplacing is true");
                            Optional<UUID> representingIdOptional = Optional.ofNullable(partyList)
                                    .orElse(Collections.emptyList())
                                    .stream()
                                    .filter(r -> r.getIndividualId().equalsIgnoreCase(representing.getIndividualId()))
                                    .map(Party::getId)
                                    .findFirst(); // Extract first matching UUID

                            // Set ID only if present
                            representingIdOptional.ifPresent(representing::setId);
                        }
                    });

                }

                if (!isPaymentCompleted) {
                    //create task
                    createTaskAndDemand(joinCaseRequest);
                } else {

                    verifyRepresentativesAndJoinCase(joinCaseRequest, courtCase, caseObj, auditDetails, advocateIds, existingRepresentative);

                    if (joinCaseRequest.getLitigant() != null && !joinCaseRequest.getLitigant().isEmpty())
                        verifyLitigantsAndJoinCase(joinCaseRequest, courtCase, caseObj, auditDetails);

                    AdvocateMapping advocateMapping = mapRepresentativeToAdvocateMapping(joinCaseRequest.getRepresentative());
                    Set<String> individualIdSet = getIndividualId(advocateMapping);
                    Set<String> phonenumbers = callIndividualService(joinCaseRequest.getRequestInfo(), individualIdSet);
                    LinkedHashMap advocate = ((LinkedHashMap) advocateMapping.getAdditionalDetails());
                    String advocateName = advocate != null ? advocate.get(ADVOCATE_NAME).toString() : "";

                    SmsTemplateData smsTemplateData = SmsTemplateData.builder()
                            .cmpNumber(courtCase.getCmpNumber())
                            .efilingNumber(courtCase.getFilingNumber())
                            .advocateName(advocateName)
                            .tenantId(courtCase.getTenantId()).build();
                    for (String number : phonenumbers) {
                        notificationService.sendNotification(joinCaseRequest.getRequestInfo(), smsTemplateData, ADVOCATE_CASE_JOIN, number);
                    }
                }
            }

            return JoinCaseResponse.builder().joinCaseRequest(joinCaseRequest).build();

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Invalid request for joining a case :: {}", e.toString());
            throw new CustomException(JOIN_CASE_ERR, JOIN_CASE_INVALID_REQUEST);
        }
    }

    public CaseCodeResponse verifyJoinCaseCodeV2Request(CaseCodeRequest caseCodeRequest) {
        try {
            String filingNumber = caseCodeRequest.getCode().getFilingNumber();
            List<CaseCriteria> existingApplications = caseRepository.getCases(Collections.singletonList(CaseCriteria.builder().filingNumber(filingNumber).build()), caseCodeRequest.getRequestInfo());
            log.info("Existing application list :: {}", existingApplications.size());
            if (existingApplications.isEmpty()) {
                throw new CustomException(CASE_EXIST_ERR, "Case does not exist");
            }
            Boolean isValid = validateAccessCode(caseCodeRequest, existingApplications.get(0).getResponseList().get(0));
            return CaseCodeResponse.builder().isValid(isValid).build();
        }
        catch (CustomException e){
            throw e;
        }
        catch (Exception e){
            log.error("Failed to verify the given litigants and representatives to be added to the case :: {}", e.toString());
            throw new CustomException(JOIN_CASE_ERR, JOIN_CASE_CODE_INVALID_REQUEST);
        }
    }

    private void createTaskAndDemand(JoinCaseRequest joinCaseRequest) {
        TaskRequest taskRequest = new TaskRequest();
        Task task = new Task();
        task.setTaskType(JOIN_CASE_TASK);
        task.setStatus("");
        task.setTenantId(joinCaseRequest.getRequestInfo().getUserInfo().getTenantId());
        task.setFilingNumber(joinCaseRequest.getCaseFilingNumber());
        Workflow workflow = new Workflow();
        workflow.setAction("CREATE");
        RequestInfo requestInfo = joinCaseRequest.getRequestInfo();
        Role role = new Role();
        role.setName("TASK_CREATOR");
        role.setCode("TASK_CREATOR");
        List<Role> roles = requestInfo.getUserInfo().getRoles();
        roles.add(role);
        requestInfo.getUserInfo().setRoles(roles);
        task.setWorkflow(workflow);
        ObjectMapper objectMapper = new ObjectMapper();

        Object additionalDetails = objectMapper.convertValue(joinCaseRequest, Object.class);
        task.setAdditionalDetails(additionalDetails);

        taskRequest.setTask(task);
        taskRequest.setRequestInfo(joinCaseRequest.getRequestInfo());

        TaskResponse taskResponse = taskUtil.callCreateTask(taskRequest);
        String consumerCode = taskResponse.getTask().getTaskNumber() + "_JOIN_CASE";

        //create demand
        billingUtil.createDemand(joinCaseRequest, consumerCode);

        joinCaseRequest.setConsumerCode(consumerCode);
    }

    private Set<String> getIndividualId(AdvocateMapping advocateMapping) {
        return Optional.ofNullable(advocateMapping)
                .map(AdvocateMapping::getRepresenting)
                .orElse(Collections.emptyList())
                .stream()
                .map(party -> Optional.ofNullable(party)
                        .map(Party::getIndividualId)
                        .orElse(null))
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    private void verifyRepresentativesAndJoinCase(JoinCaseRequest joinCaseRequest, CourtCase courtCase, CourtCase
            caseObj, AuditDetails auditDetails, List<String> advocateIds, AdvocateMapping existingRepresentative) {
        //Setting representative ID as null to resolve later as per need
        joinCaseRequest.getRepresentative().setId(null);

        //when advocate is part of the case
        if (!advocateIds.isEmpty() && joinCaseRequest.getRepresentative().getAdvocateId() != null && advocateIds.contains(joinCaseRequest.getRepresentative().getAdvocateId())) {
            log.info("Advocate is not representing the individual");
            joinCaseRequest.getRepresentative().setId(existingRepresentative.getId());
        }

        if (joinCaseRequest.getRepresentative().getRepresenting() != null) {
            joinCaseRequest.getRepresentative().getRepresenting().forEach(representing -> {
                representing.setAuditDetails(auditDetails);
                if (representing.getIsAdvocateReplacing())
                    disableExistingRepresenting(joinCaseRequest.getRequestInfo(), courtCase, representing.getIndividualId(), auditDetails, joinCaseRequest.getRepresentative().getAdvocateId());
            });
        }
        AdvocateMapping advocateMapping = mapRepresentativeToAdvocateMapping(joinCaseRequest.getRepresentative());

        caseObj.setRepresentatives(Collections.singletonList(advocateMapping));
        joinCaseRequest.getRepresentative().setAuditDetails(auditDetails);
        verifyAndEnrichRepresentative(joinCaseRequest, courtCase, caseObj, auditDetails);
    }

    public static AdvocateMapping mapRepresentativeToAdvocateMapping(Representative representative) {
        AdvocateMapping advocateMapping = new AdvocateMapping();
        advocateMapping.setId(representative.getId());
        advocateMapping.setAdvocateId(representative.getAdvocateId());
        if (representative.getRepresenting() != null && !representative.getRepresenting().isEmpty())
            advocateMapping.setRepresenting(mapRepresentingToParty(representative.getRepresenting()));
        advocateMapping.setIsActive(representative.getIsActive());
        advocateMapping.setDocuments(representative.getDocuments());
        advocateMapping.setAdditionalDetails(representative.getAdditionalDetails());
        advocateMapping.setCaseId(representative.getCaseId());
        advocateMapping.setTenantId(representative.getTenantId());
        advocateMapping.setAuditDetails(representative.getAuditDetails());
        advocateMapping.setHasSigned(representative.getHasSigned());
        return advocateMapping;
    }

    public static List<Party> mapRepresentingToParty(List<Representing> representingList) {
        List<Party> partyList = new ArrayList<>();
        for (Representing representing : representingList) {
            Party party = new Party();
            party.setId(representing.getId());
            party.setIndividualId(representing.getIndividualId());
            party.setIsActive(representing.getIsActive());
            party.setDocuments(representing.getDocuments());
            party.setAdditionalDetails(representing.getAdditionalDetails());
            party.setCaseId(representing.getCaseId());
            party.setTenantId(representing.getTenantId());
            party.setAuditDetails(representing.getAuditDetails());
            party.setHasSigned(representing.getHasSigned());
            party.setPartyType(representing.getPartyType());
            party.setOrganisationID(representing.getOrganisationID());
            party.setPartyCategory(representing.getPartyCategory());
            partyList.add(party);
        }

        return partyList;
    }

    private void disableExistingRepresenting(RequestInfo requestInfo, CourtCase courtCase, String
            joinCasePartyIndividualId, AuditDetails auditDetails, String advocateId) {
        if (courtCase.getRepresentatives() != null) {
            courtCase.getRepresentatives().forEach(representative -> {

                if (representative.getRepresenting() != null) {
                    representative.getRepresenting().forEach(party -> {
                        //For getting the representing of the representative by the individualID
                        if (joinCasePartyIndividualId.equalsIgnoreCase(party.getIndividualId()) && !representative.getAdvocateId().equalsIgnoreCase(advocateId)) {
                            log.info("Setting isActive false for the existing individual :: {}", party);
                            party.setIsActive(false);
                            party.getAuditDetails().setLastModifiedTime(auditDetails.getLastModifiedTime());
                            party.getAuditDetails().setLastModifiedBy(auditDetails.getLastModifiedBy());
                        }
                    });
                }
                //if advocate is not representing anyone then remove from court case
                List<Party> representingList = Optional.ofNullable(representative.getRepresenting())
                        .orElse(Collections.emptyList())
                        .stream()
                        .filter(Party::getIsActive)
                        .toList();

                if (representingList.isEmpty()) {
                    log.info("Setting isActive false for the representative if he is only representing the above party :: {}", representative);
                    representative.setIsActive(false);
                    representative.getAuditDetails().setLastModifiedTime(auditDetails.getLastModifiedTime());
                    representative.getAuditDetails().setLastModifiedBy(auditDetails.getLastModifiedBy());
                }

                JoinCaseRequest joinCaseRequest = JoinCaseRequest.builder().requestInfo(requestInfo).representative(mapAdvocateMappingToRepresentative(representative)).build();
                producer.push(config.getUpdateRepresentativeJoinCaseTopic(), joinCaseRequest);

            });
            courtCase.setRepresentatives(
                    courtCase.getRepresentatives().stream()
                            .filter(AdvocateMapping::getIsActive) // Filter only active representatives
                            .peek(representative -> { // Modify the representative
                                representative.setRepresenting(
                                        representative.getRepresenting().stream()
                                                .filter(Party::getIsActive) // Keep only active parties
                                                .collect(Collectors.toList())
                                );
                            })
                            .collect(Collectors.toList())
            );

        }
    }

    public static Representative mapAdvocateMappingToRepresentative(AdvocateMapping advocateMapping) {
        Representative representative = new Representative();
        representative.setId(advocateMapping.getId());
        representative.setAdvocateId(advocateMapping.getAdvocateId());
        if (advocateMapping.getRepresenting() != null && !advocateMapping.getRepresenting().isEmpty())
            representative.setRepresenting(mapPartyListToRepresentingList(advocateMapping.getRepresenting()));
        representative.setIsActive(advocateMapping.getIsActive());
        representative.setDocuments(advocateMapping.getDocuments());
        representative.setAdditionalDetails(advocateMapping.getAdditionalDetails());
        representative.setCaseId(advocateMapping.getCaseId());
        representative.setTenantId(advocateMapping.getTenantId());
        representative.setAuditDetails(advocateMapping.getAuditDetails());
        representative.setHasSigned(advocateMapping.getHasSigned());
        return representative;
    }

    public static List<Representing> mapPartyListToRepresentingList(List<Party> partyList) {
        List<Representing> representingList = new ArrayList<>();

        for (Party party : partyList) {
            Representing representing = new Representing();
            representing.setId(party.getId());
            representing.setIndividualId(party.getIndividualId());
            representing.setIsActive(party.getIsActive());
            representing.setDocuments(party.getDocuments());
            representing.setAdditionalDetails(party.getAdditionalDetails());
            representing.setCaseId(party.getCaseId());
            representing.setTenantId(party.getTenantId());
            representing.setAuditDetails(party.getAuditDetails());
            representing.setHasSigned(party.getHasSigned());
            representing.setPartyType(party.getPartyType());
            representing.setOrganisationID(party.getOrganisationID());
            representing.setPartyCategory(party.getPartyCategory());

            representingList.add(representing);
        }

        return representingList;
    }

    private void verifyLitigantsAndJoinCase(JoinCaseRequest joinCaseRequest, CourtCase courtCase, CourtCase
            caseObj, AuditDetails auditDetails) {

        if (joinCaseRequest.getIsLitigantPIP() && joinCaseRequest.getLitigant().get(0).getId() != null) {
            Party litigant = Optional.ofNullable(courtCase.getLitigants())
                    .orElse(Collections.emptyList())
                    .stream()
                    .filter(p -> p.getIndividualId().equalsIgnoreCase(joinCaseRequest.getLitigant().get(0).getIndividualId())).toList().get(0);

            List<AdvocateMapping> representatives = courtCase.getRepresentatives();

            if (representatives != null)
                disableExistingRepresenting(joinCaseRequest.getRequestInfo(), courtCase, litigant.getIndividualId(), auditDetails, null);

        }

        caseObj.setLitigants(joinCaseRequest.getLitigant());
        verifyAndEnrichLitigant(joinCaseRequest, courtCase, caseObj, auditDetails);
    }

    private @NotNull CourtCase validateAccessCodeAndReturnCourtCase(JoinCaseRequest
                                                                            joinCaseRequest, List<CaseCriteria> existingApplications) {
        if (existingApplications.isEmpty()) {
            throw new CustomException(CASE_EXIST_ERR, "Case does not exist");
        }
        List<CourtCase> courtCaseList = existingApplications.get(0).getResponseList();
        if (courtCaseList.isEmpty()) {
            throw new CustomException(CASE_EXIST_ERR, "Case does not exist");
        }

        CourtCase courtCase = encryptionDecryptionUtil.decryptObject(courtCaseList.get(0), config.getCaseDecryptSelf(), CourtCase.class, joinCaseRequest.getRequestInfo());

        if (courtCase.getAccessCode() == null || courtCase.getAccessCode().isEmpty()) {
            throw new CustomException(VALIDATION_ERR, "Access code not generated");
        }
        String caseAccessCode = courtCase.getAccessCode();

        if (!joinCaseRequest.getAccessCode().equalsIgnoreCase(caseAccessCode)) {
            throw new CustomException(VALIDATION_ERR, "Invalid access code");
        }
        return courtCase;
    }

    private @NotNull Boolean validateAccessCode(CaseCodeRequest caseCodeRequest, CourtCase existingCourtCase) {

        CourtCase courtCase = encryptionDecryptionUtil.decryptObject(existingCourtCase, config.getCaseDecryptSelf(), CourtCase.class, caseCodeRequest.getRequestInfo());

        if (courtCase.getAccessCode() == null || courtCase.getAccessCode().isEmpty()) {
            throw new CustomException(VALIDATION_ERR, "Access code not generated");
        }
        String caseAccessCode = courtCase.getAccessCode();

        return caseCodeRequest.getCode().getCode().equalsIgnoreCase(caseAccessCode);
    }

    private String getRedisKey(RequestInfo requestInfo, String caseId) {
        return requestInfo.getUserInfo().getTenantId() + ":" + caseId;
    }

    public CourtCase searchRedisCache(RequestInfo requestInfo, String caseId) {
        try {
            Object value = cacheService.findById(getRedisKey(requestInfo, caseId));
            log.info("Redis data received :: {}", value);
            if (value != null) {
                String caseObject = objectMapper.writeValueAsString(value);
                return objectMapper.readValue(caseObject, CourtCase.class);
            } else {
                return null;
            }
        } catch (JsonProcessingException e) {
            log.error("Error occurred while searching case in redis cache :: {}", e.toString());
            throw new CustomException(SEARCH_CASE_ERR, e.getMessage());
        }
    }

    public void saveInRedisCache(List<CaseCriteria> casesList, RequestInfo requestInfo) {
        for (CaseCriteria criteria : casesList) {
            if (!criteria.getDefaultFields() && criteria.getCaseId() != null && criteria.getResponseList() != null) {
                for (CourtCase courtCase : criteria.getResponseList()) {
                    cacheService.save(requestInfo.getUserInfo().getTenantId() + ":" + courtCase.getId().toString(), courtCase);
                }
            }
        }
    }


    private void setOrRemoveField(ObjectNode sourceNode, ObjectNode targetNode, String fieldName) {
        if (sourceNode.has(fieldName)) {
            targetNode.set(fieldName, sourceNode.get(fieldName));
        } else {
            targetNode.remove(fieldName);
        }
    }

    private Object editAdvocateDetails(Object additionalDetails1, Object additionalDetails2) {
        // Convert the Objects to ObjectNodes for easier manipulation
        ObjectNode details1Node = objectMapper.convertValue(additionalDetails1, ObjectNode.class);
        ObjectNode details2Node = objectMapper.convertValue(additionalDetails2, ObjectNode.class);

        // Replace the specified field in additionalDetails2 with the value from additionalDetails1
        if (details1Node.has("advocateDetails")) {
            details2Node.set("advocateDetails", details1Node.get("advocateDetails"));
        } else {
            throw new CustomException(VALIDATION_ERR, "advocateDetails not found in additionalDetails object.");
        }

        // Convert the updated ObjectNode back to its original form
        return objectMapper.convertValue(details2Node, additionalDetails2.getClass());
    }


    private Object editRespondantDetails(Object additionalDetails1, Object
            additionalDetails2, List<Party> litigants, boolean isLitigantPIP) {
        // Convert the Objects to ObjectNodes for easier manipulation
        ObjectNode details1Node = objectMapper.convertValue(additionalDetails1, ObjectNode.class);
        ObjectNode details2Node = objectMapper.convertValue(additionalDetails2, ObjectNode.class);

        // Check if respondentDetails exists in both details1Node and details2Node
        if (details1Node.has("respondentDetails") && details2Node.has("respondentDetails")) {
            ObjectNode respondentDetails1 = (ObjectNode) details1Node.get("respondentDetails");
            ObjectNode respondentDetails2 = (ObjectNode) details2Node.get("respondentDetails");

            // Check if formdata exists and is an array in both respondentDetails
            if (respondentDetails1.has("formdata") && respondentDetails1.get("formdata").isArray()
                    && respondentDetails2.has("formdata") && respondentDetails2.get("formdata").isArray()) {
                ArrayNode formData1 = (ArrayNode) respondentDetails1.get("formdata");
                ArrayNode formData2 = (ArrayNode) respondentDetails2.get("formdata");

                // Iterate over formData in respondentDetails1 to find matching individualId and copy fields
                for (int i = 0; i < formData1.size(); i++) {
                    ObjectNode dataNode1 = (ObjectNode) formData1.get(i).path("data");
                    ObjectNode dataNode2 = (ObjectNode) formData2.get(i).path("data");

                    log.info("dataNode1 :: {}", dataNode1);
                    log.info("dataNode2 :: {}", dataNode2);

                    if (dataNode1.has("respondentVerification")) {
                        JsonNode individualDetails1 = dataNode1.path("respondentVerification").path("individualDetails");
                        for (Party litigant : litigants) {
                            if (individualDetails1.has("individualId") && litigant.getIndividualId().equals(individualDetails1.get("individualId").asText())) {
                                // Set or remove fields in dataNode2 based on dataNode1
                                log.info("individualId :: {}", litigant.getIndividualId());

                                setOrRemoveField(dataNode1, dataNode2, "respondentLastName");
                                setOrRemoveField(dataNode1, dataNode2, "respondentFirstName");
                                setOrRemoveField(dataNode1, dataNode2, "respondentMiddleName");
                                setOrRemoveField(dataNode1, dataNode2, "respondentVerification");
                                break;
                            }
                        }
                    }
                }
            } else {
                throw new CustomException(VALIDATION_ERR, "formdata is not found or is not an array in one of the respondentDetails objects.");
            }
        } else {
            throw new CustomException(VALIDATION_ERR, "respondentDetails not found in one of the additional details objects.");
        }

        if (isLitigantPIP) {
            // Replace the specified field in additionalDetails2 with the value from additionalDetails1
            if (details1Node.has("advocateDetails")) {
                details2Node.set("advocateDetails", details1Node.get("advocateDetails"));
            }
        }
        // Convert the updated ObjectNode back to its original form
        return objectMapper.convertValue(details2Node, additionalDetails2.getClass());
    }

    private CourtCase fetchCourtCaseByFilingNumber(RequestInfo requestInfo, String filingNumber) {

        CaseCriteria caseCriteria = CaseCriteria.builder().filingNumber(filingNumber).build();
        List<CaseCriteria> caseCriteriaList = caseRepository.getCases(Collections.singletonList(caseCriteria), requestInfo);
        if (caseCriteriaList.isEmpty()) {
            throw new CustomException(INVALID_CASE, "No case found for the given filing Number");
        }
        List<CourtCase> courtCaseList = caseCriteriaList.get(0).getResponseList();
        if (courtCaseList.isEmpty()) {
            throw new CustomException(INVALID_CASE, "No case found for the given filing Number");
        }
        return courtCaseList.get(0);
    }

    public void updateCaseOverallStatus(CaseStageSubStage caseStageSubStage) {

        CaseOverallStatus caseOverallStatus = caseStageSubStage.getCaseOverallStatus();

        CourtCase courtCaseDb = fetchCourtCaseByFilingNumber(caseStageSubStage.getRequestInfo(), caseOverallStatus.getFilingNumber());
        CourtCase courtCaseRedis = searchRedisCache(caseStageSubStage.getRequestInfo(), courtCaseDb.getId().toString());

        if (courtCaseRedis != null) {
            courtCaseRedis.setStage(caseOverallStatus.getStage());
            courtCaseRedis.setSubstage(caseOverallStatus.getSubstage());
        }
        updateCourtCaseInRedis(caseOverallStatus.getTenantId(), courtCaseRedis);
    }

    public void updateCaseOutcome(CaseOutcome caseOutcome) {

        Outcome outcome = caseOutcome.getOutcome();

        CourtCase courtCaseDb = fetchCourtCaseByFilingNumber(caseOutcome.getRequestInfo(), outcome.getFilingNumber());
        CourtCase courtCaseRedis = searchRedisCache(caseOutcome.getRequestInfo(), courtCaseDb.getId().toString());

        if (courtCaseRedis != null) {
            courtCaseRedis.setOutcome(outcome.getOutcome());
        }
        updateCourtCaseInRedis(outcome.getTenantId(), courtCaseRedis);

    }

    public List<CaseSummary> getCaseSummary(@Valid CaseSummaryRequest request) {

        List<CaseSummary> caseSummary = caseRepository.getCaseSummary(request);

        return caseSummary;
    }

    private void publishToJoinCaseIndexer(RequestInfo requestInfo, CourtCase courtCase) {
        CaseRequest caseRequest = CaseRequest.builder()
                .requestInfo(requestInfo)
                .cases(courtCase)
                .build();
        producer.push(config.getJoinCaseTopicIndexer(), caseRequest);
    }

    public OpenApiCaseSummary searchByCnrNumber(@Valid OpenApiCaseSummaryRequest request) {

        return caseRepository.getCaseSummaryByCnrNumber(request);
    }

    public List<CaseListLineItem> searchByCaseType(@Valid OpenApiCaseSummaryRequest request) {

        return caseRepository.getCaseSummaryListByCaseType(request);
    }

    public OpenApiCaseSummary searchByCaseNumber(@Valid OpenApiCaseSummaryRequest request) {

        return caseRepository.getCaseSummaryByCaseNumber(request);

    }

    private void smsForNewWitnessAddition(CourtCase courtCase, AddWitnessRequest addWitnessRequest) {
        RequestInfo requestInfo = addWitnessRequest.getRequestInfo();
        long currentTimeMillis = System.currentTimeMillis();
        SimpleDateFormat sdf = new SimpleDateFormat("dd-MM-yyyy");
        String formattedDate = sdf.format(currentTimeMillis);
        SmsTemplateData smsTemplateData = SmsTemplateData.builder()
                .efilingNumber(courtCase.getFilingNumber())
                .courtCaseNumber(courtCase.getCourtCaseNumber())
                .cnrNumber(courtCase.getCnrNumber())
                .hearingDate(formattedDate)
                .cmpNumber(courtCase.getCmpNumber())
                .tenantId(addWitnessRequest.getRequestInfo().getUserInfo().getTenantId())
                .build();
        if (addWitnessRequest.getAdditionalDetails() != null) {
            Object witnessDetails = ((LinkedHashMap<?, ?>) addWitnessRequest.getAdditionalDetails()).get("witnessDetails");
            Object witnessDetailsFormData = null;
            if (witnessDetails != null) {
                witnessDetailsFormData = ((LinkedHashMap<?, ?>) witnessDetails).get("formdata");
            }
            if (witnessDetailsFormData != null) {
                List<?> witnessDetailsFormDataArray = (List<?>) witnessDetailsFormData;
                for (Object node : witnessDetailsFormDataArray) {
                    Object witnessData = ((LinkedHashMap<?, ?>) node).get("data");
                    Object witnessPhoneNumbers = ((LinkedHashMap<?, ?>) witnessData).get("phonenumbers");
                    Object mobileNumbers = ((LinkedHashMap<?, ?>) witnessPhoneNumbers).get("mobileNumber");
                    List<?> mobileNumbersText = (List<?>) mobileNumbers;
                    for (Object mobileNumber : mobileNumbersText) {
                        notificationService.sendNotification(requestInfo, smsTemplateData, NEW_WITNESS_ADDED, mobileNumber.toString());
                    }
                }
            }
        }
    }

    private void smsForOthersAsWitnessAdded(CourtCase courtCase, AddWitnessRequest addWitnessRequest) {
        RequestInfo requestInfo = addWitnessRequest.getRequestInfo();
        long currentTimeMillis = System.currentTimeMillis();
        SimpleDateFormat sdf = new SimpleDateFormat("dd-MM-yyyy");
        String formattedDate = sdf.format(currentTimeMillis);
        SmsTemplateData smsTemplateData = SmsTemplateData.builder()
                .efilingNumber(courtCase.getFilingNumber())
                .courtCaseNumber(courtCase.getCourtCaseNumber())
                .cnrNumber(courtCase.getCnrNumber())
                .hearingDate(formattedDate)
                .cmpNumber(courtCase.getCmpNumber())
                .tenantId(addWitnessRequest.getRequestInfo().getUserInfo().getTenantId())
                .build();
        Set<String> litigantAndAdvocateIndividualId = getLitigantIndividualId(courtCase);
        CaseRequest caseRequest = CaseRequest.builder()
                .cases(courtCase)
                .build();
        getAdvocateIndividualId(caseRequest, litigantAndAdvocateIndividualId);
        Set<String> phoneNumbers = callIndividualService(requestInfo, litigantAndAdvocateIndividualId);
        for (String number : phoneNumbers) {
            notificationService.sendNotification(caseRequest.getRequestInfo(), smsTemplateData, NEW_WITNESS_ADDED_SMS_FOR_OTHERS, number);
        }
    }

    public CourtCase processProfileRequest(ProcessProfileRequest request) {

        try {
            log.info("operation=processProfileRequest, status=IN_PROGRESS, pendingTaskId: {}", request.getProcessInfo().getPendingTaskRefId());
            CourtCase courtCase = searchRedisCache(request.getRequestInfo(), request.getProcessInfo().getCaseId());
            if (courtCase == null) {
                String caseId = request.getProcessInfo().getCaseId();
                CaseSearchRequest searchRequest = CaseSearchRequest.builder()
                        .requestInfo(request.getRequestInfo())
                        .criteria(List.of(CaseCriteria.builder().caseId(caseId).build()))
                        .build();
                List<CaseCriteria> existingApplications = caseRepository.getCases(searchRequest.getCriteria(), searchRequest.getRequestInfo());
                courtCase = existingApplications.get(0).getResponseList().get(0);
            }
            courtCase = encryptionDecryptionUtil.decryptObject(courtCase, config.getCaseDecryptSelf(), CourtCase.class, request.getRequestInfo());
            JsonNode additionalDetails = objectMapper.convertValue(courtCase.getAdditionalDetails(), JsonNode.class);
            if (request.getProcessInfo().getAction().equals(ActionType.ACCEPT)) {
                JsonNode profileRequests = additionalDetails.get("profileRequests");
                String idToRemove = null;
                for (JsonNode profile : profileRequests) {
                    if (profile.get("pendingTaskRefId").asText().equals(request.getProcessInfo().getPendingTaskRefId())) {
                        String partyType = profile.get("litigantDetails").get("partyType").asText();
                        String uniqueId = profile.get("litigantDetails").get("uniqueId").asText();
                        String detailsKey = partyType.equals("complainant") ? "complainantDetails" : "respondentDetails";

                        JsonNode newDetails = profile.get("newData").get(detailsKey);
                        updatePartyDetails(uniqueId, additionalDetails, newDetails, detailsKey);

                        String individualId;
                        if (detailsKey.equals("respondentDetails")) {
                            individualId = extractIndividualIdIfPresent(additionalDetails, uniqueId);
                            if(individualId == null)
                                log.info("Respondent has not joined case yet.");
                        } else {
                            individualId = uniqueId;
                        }

                        if(individualId != null) {
                            Party litigant = extractLitigant(courtCase.getLitigants(), individualId);
                            if (litigant != null) {
                                Party updatedLitigant = replaceLitigantDetails(individualId, litigant, additionalDetails.get(detailsKey), detailsKey);
                                List<Party> updatedLitigants = updateLitigant(courtCase.getLitigants(), updatedLitigant);
                                courtCase.setLitigants(updatedLitigants);
                                updateAdvocateRepresentation(courtCase, individualId, additionalDetails, detailsKey);
                            }
                        }
                        courtCase.setAdditionalDetails(additionalDetails);
                        idToRemove = profile.get("uuid").asText();
                    }
                }

                if (idToRemove != null) {
                    removeProfileRequest(idToRemove, profileRequests);
                }
                ((ObjectNode) additionalDetails).set("profileRequests", objectMapper.convertValue(profileRequests, JsonNode.class));

            } else if (request.getProcessInfo().getAction().equals(ActionType.REJECT)) {
                JsonNode profileRequests = additionalDetails.get("profileRequests");
                for (JsonNode profile : profileRequests) {
                    if (profile.get("pendingTaskRefId").asText().equals(request.getProcessInfo().getPendingTaskRefId())) {
                        removeProfileRequest(profile.get("uuid").asText(), profileRequests);
                        ((ObjectNode) additionalDetails).set("profileRequests", objectMapper.convertValue(profileRequests, JsonNode.class));
                        courtCase.setAdditionalDetails(additionalDetails);
                        break;
                    }
                }
            }
            sendProfileProcessNotification(request, courtCase);

            log.info("Encrypting case object with caseId: {}", courtCase.getId());
            courtCase = encryptionDecryptionUtil.encryptObject(courtCase, config.getCourtCaseEncrypt(), CourtCase.class);
            cacheService.save(courtCase.getTenantId() + ":" + courtCase.getId().toString(), courtCase);
            CaseRequest caseRequest = CaseRequest.builder()
                    .requestInfo(request.getRequestInfo())
                    .cases(courtCase)
                    .build();
            producer.push(config.getCaseUpdateTopic(), caseRequest);
            if(request.getProcessInfo().getAction().equals(ActionType.ACCEPT)) {
                producer.push(config.getCaseUpdateLastModifiedTimeTopic(), courtCase);
            }

            courtCase = encryptionDecryptionUtil.decryptObject(courtCase, config.getCaseDecryptSelf(), CourtCase.class, request.getRequestInfo());
            log.info("operation=processProfileRequest, status=SUCCESS, pendingTaskId: {}", request.getProcessInfo().getPendingTaskRefId());
            return courtCase;
        } catch (Exception e) {
            log.error(ERROR_PROCESS_REQUEST, e);
            throw new CustomException(ERROR_PROCESS_REQUEST, e.getMessage());
        }
    }

    private String extractIndividualIdIfPresent(JsonNode rootNode, String uniqueId) {
        JsonNode respondentDetailsNode = rootNode.path("respondentDetails")
                .path("formdata");
        if (respondentDetailsNode.isArray()) {
            for (JsonNode respondentNode : respondentDetailsNode) {
                JsonNode respondentVerificationNode = respondentNode.path("data")
                        .path("respondentVerification")
                        .path("individualDetails");
                if (!respondentVerificationNode.isMissingNode()) {
                    String individualId = respondentVerificationNode.path("individualId").asText();
                    if (!individualId.isEmpty() && individualId.equals(uniqueId)) {
                        return individualId;
                    }
                }
            }
        }
        return null;
    }

    private void removeProfileRequest(String idToRemove, JsonNode profileRequests) {
        if (profileRequests != null && profileRequests.isArray()) {
            ArrayNode arrayNode = (ArrayNode) profileRequests;

            for (int i = 0; i < arrayNode.size(); i++) {
                JsonNode profile = arrayNode.get(i);
                if (profile.has("uuid") && profile.get("uuid").asText().equals(idToRemove)) {
                    arrayNode.remove(i);
                    break;
                }
            }
        }
    }

    private List<Party> updateLitigant(List<Party> litigants, Party updatedLitigant) {
        if (litigants == null || updatedLitigant == null) {
            return litigants;
        }

        litigants.replaceAll(litigant ->
                litigant.getIndividualId().equals(updatedLitigant.getIndividualId()) ? updatedLitigant : litigant
        );
        return litigants;
    }

    private Party extractLitigant(@Valid List<Party> litigants, String individualId) {
        for (Party litigant : litigants) {
            if (litigant.getIndividualId().equals(individualId)) {
                return litigant;
            }
        }
        return null;
    }

    private void sendProfileProcessNotification(ProcessProfileRequest request, CourtCase courtCase) {
        CaseRequest caseRequest = CaseRequest.builder()
                .requestInfo(request.getRequestInfo())
                .cases(courtCase)
                .build();

        //Todo: need to configure message code and template id for messages
        if (request.getProcessInfo().getAction().equals(ActionType.ACCEPT))
            callNotificationService(caseRequest, ACCEPT_PROFILE_REQUEST);
        else if (request.getProcessInfo().getAction().equals(ActionType.REJECT))
            callNotificationService(caseRequest, REJECT_PROFILE_REQUEST);
    }

    private void updateAdvocateRepresentation(CourtCase courtCase, String uniqueId, JsonNode additionalDetails, String detailsKey) {
        log.info("operation=updateAdvocateRepresentation, status=IN_PROGRESS, uniqueId: {}", uniqueId);
        List<AdvocateMapping> representatives = courtCase.getRepresentatives();
        for (AdvocateMapping advocate : representatives) {
            Party litigant = extractLitigant(advocate.getRepresenting(), uniqueId);
            if (litigant != null) {
                Party updatedLitigant = replaceLitigantDetails(uniqueId, litigant, additionalDetails.get(detailsKey), detailsKey);
                List<Party> updatedLitigants = updateLitigant(advocate.getRepresenting(), updatedLitigant);
                advocate.setRepresenting(updatedLitigants);
                break;
            }
        }
        log.info("operation=updateAdvocateRepresentation, status=SUCCESS, uniqueId: {}", uniqueId);
        courtCase.setRepresentatives(representatives);
    }

    private void updatePartyDetails(String uniqueId, JsonNode additionalDetails, JsonNode newDetails, String detailsKey) {
        log.info("operation=updatePartyDetails, status=IN_PROGRESS, individualId: {}", uniqueId);
        JsonNode formData = additionalDetails.at("/" + detailsKey + "/formdata");
        if (formData.isArray()) {
            log.info("Updating {} with uniqueId: {}", detailsKey, uniqueId);
            for (JsonNode data : formData) {
                if (data.at(getIndividualIdPath(detailsKey)).asText().equals(uniqueId) ||
                        (detailsKey.equals("respondentDetails") && data.at("/uniqueId").asText().equals(uniqueId))) {
                    JsonNode newData = objectMapper.convertValue(newDetails, JsonNode.class);
                    ((ObjectNode) data).set("data", newData);
                }
            }
        }
        if (additionalDetails.get("advocateDetails") != null) {
            log.info("Updating advocateDetails for uniqueId: {}", uniqueId);
            for (JsonNode data : additionalDetails.get("advocateDetails").get("formdata")) {
                if (data.at(BOX_COMPLAINANT_ID_PATH).asText().equals(uniqueId)) {
                    String firstName = newDetails.get("firstName").asText();
                    String middleName = newDetails.get("middleName").asText();
                    String lastName = newDetails.get("lastName").asText();

                    JsonNode boxComplainantNode = data.at(BOX_COMPLAINANT_PATH);

                    if (boxComplainantNode.isObject()) {
                        ObjectNode boxComplainant = (ObjectNode) boxComplainantNode;

                        // Update fields
                        boxComplainant.put("firstName", firstName);
                        boxComplainant.put("middleName", middleName);
                        boxComplainant.put("lastName", lastName);
                    }
                }
            }
        }

    }

    private String getIndividualIdPath(String detailsKey) {
        return detailsKey.equals("complainantDetails") ? COMPLAINANT_INDIVIDUAL_ID_PATH : RESPONDENT_INDIVIDUAL_ID_PATH;
    }


    private Party replaceLitigantDetails(String uniqueId, Party litigant, JsonNode newLitigant, String detailsKey) {
        try {
            log.info("operation=replaceLitigantDetails, status=IN_PROGRESS, uniqueId: {}", uniqueId);
            if (litigant.getIndividualId().equals(uniqueId)) {
                JsonNode additionalDetailsNode = objectMapper.convertValue(litigant.getAdditionalDetails(), JsonNode.class);

                JsonNode formData = newLitigant.get("formdata");

                for (JsonNode data : formData) {
                    if (data.at(getIndividualIdPath(detailsKey)).asText().equals(uniqueId)) {
                        String fullName = getFullName(data, detailsKey);
                        ((ObjectNode) additionalDetailsNode).put("fullName", fullName);
                        litigant.setAdditionalDetails(objectMapper.convertValue(additionalDetailsNode, Object.class));
                        break;
                    }
                }
            }
            log.info("operation=replaceLitigantDetails, status=SUCCESS, uniqueId: {}", uniqueId);
            return litigant;
        } catch (Exception e) {
            log.error("ERROR_UPDATING_LITIGANTS", e);
            throw new CustomException("ERROR_UPDATING_LITIGANTS", e.getMessage());
        }
    }

    private String getFullName(JsonNode data, String detailsKey) {
        String fullName = null;
        if(detailsKey.equals("complainantDetails")) {
            String firstName = data.get("data").get("firstName").asText("");
            String middleName = data.get("data").get("middleName").asText("");
            String lastName = data.get("data").get("lastName").asText("");
            fullName = (firstName + " " + middleName + " " + lastName).replaceAll("\\s+", " ").trim();
        } else if(detailsKey.equals("respondentDetails")) {
            String firstName = data.get("data").get("respondentFirstName").asText("");
            String middleName = data.get("data").get("respondentMiddleName").asText("");
            String lastName = data.get("data").get("respondentLastName").asText("");
            fullName = (firstName + " " + middleName + " " + lastName).replaceAll("\\s+", " ").trim();
        }
        return fullName;
    }
}
