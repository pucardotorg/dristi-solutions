package org.pucar.dristi.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.egov.common.models.individual.AdditionalFields;
import org.egov.common.models.individual.Address;
import org.egov.common.models.individual.Field;
import org.egov.common.models.individual.Identifier;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.enrichment.CaseRegistrationEnrichment;
import org.pucar.dristi.enrichment.EnrichmentService;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.CaseRepository;
import org.pucar.dristi.util.*;
import org.pucar.dristi.validators.CaseRegistrationValidator;
import org.pucar.dristi.validators.EvidenceValidator;
import org.pucar.dristi.web.OpenApiCaseSummary;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.analytics.CaseOutcome;
import org.pucar.dristi.web.models.analytics.CaseOverallStatus;
import org.pucar.dristi.web.models.analytics.CaseStageSubStage;
import org.pucar.dristi.web.models.analytics.Outcome;
import org.pucar.dristi.web.models.inbox.InboxRequest;
import org.pucar.dristi.web.models.task.Task;
import org.pucar.dristi.web.models.task.TaskRequest;
import org.pucar.dristi.web.models.task.TaskResponse;
import org.pucar.dristi.web.models.v2.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.BiConsumer;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

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
    private final EtreasuryUtil etreasuryUtil;
    private final EncryptionDecryptionUtil encryptionDecryptionUtil;
    private final ObjectMapper objectMapper;
    private final CacheService cacheService;

    private final EnrichmentService enrichmentService;

    private final SmsNotificationService notificationService;

    private final IndividualService individualService;

    private final AdvocateUtil advocateUtil;
    private final TaskUtil taskUtil;
    private final HearingUtil hearingUtil;
    private final UserService userService;
    private final EvidenceUtil evidenceUtil;
    private final EvidenceValidator evidenceValidator;
    private final PaymentCalculaterUtil paymentCalculaterUtil;

    private final CaseUtil caseUtil;

    private final FileStoreUtil fileStoreUtil;
    private final OrderUtil orderUtil;
    private final DateUtil dateUtil;
    private final InboxUtil inboxUtil;


    @Autowired
    public CaseService(@Lazy CaseRegistrationValidator validator,
                       CaseRegistrationEnrichment enrichmentUtil,
                       CaseRepository caseRepository,
                       WorkflowService workflowService,
                       Configuration config,
                       Producer producer,
                       TaskUtil taskUtil,
                       EtreasuryUtil etreasuryUtil,
                       EncryptionDecryptionUtil encryptionDecryptionUtil,
                       HearingUtil analyticsUtil,
                       UserService userService,
                       PaymentCalculaterUtil paymentCalculaterUtil,
                       ObjectMapper objectMapper, CacheService cacheService, EnrichmentService enrichmentService, SmsNotificationService notificationService, IndividualService individualService, AdvocateUtil advocateUtil, EvidenceUtil evidenceUtil, EvidenceValidator evidenceValidator, CaseUtil caseUtil, FileStoreUtil fileStoreUtil, OrderUtil orderUtil, DateUtil dateUtil, InboxUtil inboxUtil) {
        this.validator = validator;
        this.enrichmentUtil = enrichmentUtil;
        this.caseRepository = caseRepository;
        this.workflowService = workflowService;
        this.config = config;
        this.producer = producer;
        this.taskUtil = taskUtil;
        this.etreasuryUtil = etreasuryUtil;
        this.encryptionDecryptionUtil = encryptionDecryptionUtil;
        this.hearingUtil = analyticsUtil;
        this.userService = userService;
        this.paymentCalculaterUtil = paymentCalculaterUtil;
        this.objectMapper = objectMapper;
        this.cacheService = cacheService;
        this.enrichmentService = enrichmentService;
        this.notificationService = notificationService;
        this.individualService = individualService;
        this.advocateUtil = advocateUtil;
        this.evidenceUtil = evidenceUtil;
        this.evidenceValidator = evidenceValidator;
        this.caseUtil = caseUtil;
        this.fileStoreUtil = fileStoreUtil;
        this.orderUtil = orderUtil;
        this.dateUtil = dateUtil;
        this.inboxUtil = inboxUtil;
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

    private static void validateLitigantAlreadyPartOfCase(CourtCase courtCase, JoinCaseDataV2 joinCaseData) {
        // Stream over the litigants to create a list of individualIds
        List<String> individualIds = Optional.ofNullable(courtCase.getLitigants())
                .orElse(Collections.emptyList())
                .stream()
                .map(Party::getIndividualId)
                .toList();

        for (JoinCaseLitigant litigant : joinCaseData.getLitigant()) {
            if (litigant.getIndividualId() != null && individualIds.contains(litigant.getIndividualId()) && !litigant.getIsPip()) {
                throw new CustomException(VALIDATION_ERR, "Litigant is already a part of the given case");
            }
        }
    }

    private static @NotNull String getName(Individual individualForLitigant) {
        String givenName = individualForLitigant.getName().getGivenName();
        String otherNames = individualForLitigant.getName().getOtherNames();
        String familyName = individualForLitigant.getName().getFamilyName();

        // Concatenate the name with spaces, ensuring null values are handled
        String name = (givenName != null ? givenName : "") +
                (otherNames != null ? " " + otherNames : "") +
                (familyName != null ? " " + familyName : "");
        return name;
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

    public CourtCase createCase(CaseRequest body) {
        try {
            validator.validateCaseRegistration(body);

            // Validate that user is authorized to file on behalf of the advocate
            validator.validateAdvocateAuthorization(body.getRequestInfo(), body.getCases());

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
                    decryptedCourtCases.forEach(
                            courtCase -> {
                                enrichAdvocateJoinedStatus(courtCase, caseCriteria.getAdvocateId());
                            });
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

    private void enrichAdvocateJoinedStatus(CourtCase courtCase, String advocateId) {
        if (advocateId != null && courtCase.getPendingAdvocateRequests() != null) {
            Optional<PendingAdvocateRequest> foundPendingAdvocateRequest = courtCase.getPendingAdvocateRequests().stream().filter(pendingAdvocateRequest -> pendingAdvocateRequest.getAdvocateId().equalsIgnoreCase(advocateId)).findFirst();
            foundPendingAdvocateRequest.ifPresentOrElse(
                    pendingAdvocateRequest -> courtCase.setAdvocateStatus(pendingAdvocateRequest.getStatus()),
                    () -> courtCase.setAdvocateStatus("JOINED")
            );
        }
    }

    public CourtCase updateCase(CaseRequest caseRequest) {

        try {
            log.info("Method=updateCase,Result=IN_PROGRESS, CaseId={}", caseRequest.getCases().getId());
            //Search and validate case Exist
            List<CaseCriteria> existingApplications = caseRepository.getCases(Collections.singletonList(CaseCriteria.builder().filingNumber(caseRequest.getCases().getFilingNumber()).caseId(String.valueOf(caseRequest.getCases().getId())).cnrNumber(caseRequest.getCases().getCnrNumber()).courtCaseNumber(caseRequest.getCases().getCourtCaseNumber()).build()), caseRequest.getRequestInfo());

            String courtId = caseRequest.getCases().getCourtId();
            // Validate whether the application that is being requested for update indeed exists
            if (!validator.validateUpdateRequest(caseRequest, existingApplications.get(0).getResponseList())) {
                throw new CustomException(VALIDATION_ERR, "Case Application does not exist");
            }

            //todo: enhance for files delete
            List<Document> documentToDelete  = extractDocumentsToDelete(caseRequest.getCases(), existingApplications.get(0).getResponseList().get(0));
            // Enrich application upon update
            enrichmentUtil.enrichCaseApplicationUponUpdate(caseRequest, existingApplications.get(0).getResponseList());


            // conditional enrichment using strategy
            enrichmentService.enrichCourtCase(caseRequest);
            String previousStatus = caseRequest.getCases().getStatus();
            if (PENDING_RE_SIGN.equals(previousStatus)) {
                Calculation calculation = compareCalculationAndCreateDemand(caseRequest);
                if (calculation != null) {
                    caseRequest.getCases().getWorkflow().setAction(UPLOAD_WITH_PAYMENT);
                }
            }
            workflowService.updateWorkflowStatus(caseRequest);


            if (caseRequest.getCases().getCourtId() == null && PENDING_REGISTRATION.equalsIgnoreCase(caseRequest.getCases().getStatus())) {
                caseRequest.getCases().setCourtId(courtId);
            }

            // check for last e-sign
            // if its last e-sign update the process instance case will move to pending payment

            Boolean lastSigned = checkItsLastSign(caseRequest);

            if (lastSigned) {
                log.info("Last e-sign for case {}", caseRequest.getCases().getId());
                Calculation calculation = compareCalculationAndCreateDemand(caseRequest);
                caseRequest.getRequestInfo().getUserInfo().getRoles().add(Role.builder().id(123L).code(SYSTEM).name(SYSTEM).tenantId(caseRequest.getCases().getTenantId()).build());
                if (calculation != null) {
                    caseRequest.getCases().getWorkflow().setAction(E_SIGN_COMPLETE_WITH_PAYMENT);
                } else {
                    caseRequest.getCases().getWorkflow().setAction(E_SIGN_COMPLETE);
                }
                log.info("Updating workflow status for case {} in last e-sign", caseRequest.getCases().getId());
                workflowService.updateWorkflowStatus(caseRequest);
            }

            checkItsLastResponse(caseRequest);

            if (CASE_ADMIT_STATUS.equals(caseRequest.getCases().getStatus())) {
                enrichmentUtil.enrichCourtCaseNumber(caseRequest);
                caseRequest.getCases().setCaseType(ST);
                updateCaseConversion(caseRequest);
                producer.push(config.getCaseReferenceUpdateTopic(), createHearingUpdateRequest(caseRequest));
            }

            boolean isAccessCodeGenerated = false;
            if (PENDING_REGISTRATION.equals(caseRequest.getCases().getStatus()) || PENDING_RESPONSE.equals(caseRequest.getCases().getStatus())) {
                if (caseRequest.getCases().getAccessCode() == null) {
                    isAccessCodeGenerated = true;
                }
                enrichmentUtil.enrichAccessCode(caseRequest);
            }

            if (PENDING_RESPONSE.equals(caseRequest.getCases().getStatus())) {
                enrichmentUtil.enrichCNRNumber(caseRequest);
                enrichmentUtil.enrichCMPNumber(caseRequest);
                enrichmentUtil.enrichRegistrationDate(caseRequest);
                caseRequest.getCases().setCaseType(CMP);
                updateCaseConversion(caseRequest);
                producer.push(config.getCaseReferenceUpdateTopic(), createHearingUpdateRequest(caseRequest));
            }
            //todo: enhance for files delete
            removeInactiveDocuments(documentToDelete);
            log.info("Encrypting case: {}", caseRequest.getCases().getId());

            //to prevent from double encryption
            String encryptedAccessCode = caseRequest.getCases().getAccessCode();
            caseRequest.setCases(encryptionDecryptionUtil.encryptObject(caseRequest.getCases(), config.getCourtCaseEncrypt(), CourtCase.class));

            if (!isAccessCodeGenerated) {
                caseRequest.getCases().setAccessCode(encryptedAccessCode);
            }

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
            List<POAHolder> activePOAHolder = Optional.ofNullable(caseRequest.getCases().getPoaHolders()).orElse(Collections.emptyList()).stream().filter(POAHolder::getIsActive).toList();
            activePOAHolder.forEach(poaHolder -> {
                List<PoaParty> activeLitigants = Optional.ofNullable(poaHolder.getRepresentingLitigants())
                        .orElse(Collections.emptyList())
                        .stream()
                        .filter(party -> Boolean.TRUE.equals(party.getIsActive()))
                        .collect(Collectors.toList());

                // Set the filtered active litigants back to the POAHolder
                poaHolder.setRepresentingLitigants(activeLitigants);
            });

            filterDocuments(activeAdvocateMapping,
                    AdvocateMapping::getDocuments,
                    AdvocateMapping::setDocuments);

            activeAdvocateMapping.forEach(advocate ->
                    filterDocuments(advocate.getRepresenting(),
                            Party::getDocuments,
                            Party::setDocuments)
            );

            filterDocuments(activeParty,
                    Party::getDocuments,
                    Party::setDocuments);

            filterDocuments(activePOAHolder,
                    POAHolder::getDocuments,
                    POAHolder::setDocuments);

            activePOAHolder.forEach(poaHolder ->
                    filterDocuments(poaHolder.getRepresentingLitigants(),
                            PoaParty::getDocuments,
                            PoaParty::setDocuments)
            );

            caseRequest.getCases().setPoaHolders(activePOAHolder);
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
                    callNotificationService(caseRequest, msgCode, null);
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

    private List<Document> extractDocumentsToDelete(@Valid CourtCase updateCase, @Valid CourtCase existingCase) {
        if (updateCase == null || existingCase == null) {
            throw new IllegalArgumentException("Both updateCase and existingCase must not be null");
        }
        // Safely get the document list using Optional
        List<Document> documents = Optional.ofNullable(updateCase.getDocuments())
                .orElse(Collections.emptyList());

        // Collect docs with getToDelete() == true
        List<Document> docsToDelete = documents.stream()
                .filter(doc -> Boolean.TRUE.equals(doc.getToDelete()))
                .toList();

        // Remove documents marked for delete (only if list is modifiable)
        Optional.ofNullable(updateCase.getDocuments())
                .ifPresent(list -> list.removeIf(doc -> Boolean.TRUE.equals(doc.getToDelete())));

        Map<String, Document> updatedDocumentsMap = toFileStoreMap(updateCase.getDocuments());
        Map<String, Document> existingDocumentsMap = toFileStoreMap(existingCase.getDocuments());
        // Collect documents from existingCase that are not present in updateCase
        Set<String> updatedFileStoreIds = updatedDocumentsMap.keySet();
        List<Document> documentsToDelete = existingDocumentsMap.entrySet().stream()
                .filter(entry -> {
                    if (COMPLAINANT_ID_PROOF.equals(entry.getValue().getDocumentType())
                            && !updatedFileStoreIds.contains(entry.getKey())) {
                        entry.getValue().setIsActive(false);
                        return false;
                    }
                    return !updatedFileStoreIds.contains(entry.getKey());
                })
                .map(entry -> {
                    Document doc = entry.getValue();
                    doc.setIsActive(false);
                    return doc;
                })
                .collect(Collectors.toList());

        documentsToDelete.addAll(docsToDelete);
        documentsToDelete.addAll(extractLitigantDocuments(updateCase, existingCase));
        documentsToDelete.addAll(extractRepresentativeDocuments(updateCase, existingCase));
        documentsToDelete.addAll(extractLinkedCasesDocuments(updateCase, existingCase));

        // Remove duplicates using fileStoreId
        Map<String, Document> uniqueByFileStore = documentsToDelete.stream()
                .collect(Collectors.toMap(Document::getFileStore, doc -> doc, (d1, d2) -> d1));

        return List.copyOf(uniqueByFileStore.values());
    }

    private Map<String, Document> toFileStoreMap(List<Document> documents) {
        if (documents == null) {
            return Collections.emptyMap();
        }
        return documents.stream()
                .filter(doc -> doc.getFileStore() != null)
                .collect(Collectors.toMap(Document::getFileStore, doc -> doc, (d1, d2) -> d1));
    }


    private List<Document> extractLitigantDocuments(CourtCase updateCase, CourtCase existingCase) {
        List<Document> documentsToDelete = new ArrayList<>();
        if (existingCase.getLitigants() != null) {
            for (Party existingLit : existingCase.getLitigants()) {
                Party updateLit = findById(updateCase.getLitigants(), existingLit.getId(), Party::getId);
                if (updateLit != null) {
                    documentsToDelete.addAll(processDocumentDifferences(
                            updateLit.getDocuments(), existingLit.getDocuments(), updateLit.getDocuments()));
                }
            }
        }
        return documentsToDelete;
    }

    private List<Document> extractRepresentativeDocuments(CourtCase updateCase, CourtCase existingCase) {
        List<Document> documentsToDelete = new ArrayList<>();
        if (existingCase.getRepresentatives() != null) {
            for (AdvocateMapping existingRep : existingCase.getRepresentatives()) {
                AdvocateMapping updateRep = findById(updateCase.getRepresentatives(), existingRep.getId(), AdvocateMapping::getId);
                if (updateRep != null) {
                    documentsToDelete.addAll(processDocumentDifferences(
                            updateRep.getDocuments(), existingRep.getDocuments(), updateRep.getDocuments()));

                    if (existingRep.getRepresenting() != null) {
                        for (Party existingParty : existingRep.getRepresenting()) {
                            Party updateParty = findById(
                                    Optional.ofNullable(updateRep.getRepresenting()).orElse(Collections.emptyList()),
                                    existingParty.getId(),
                                    Party::getId);
                            if (updateParty != null) {
                                documentsToDelete.addAll(processDocumentDifferences(
                                        updateParty.getDocuments(), existingParty.getDocuments(), updateParty.getDocuments()));
                            }
                        }
                    }
                }
            }
        }
        return documentsToDelete;
    }

    private List<Document> extractLinkedCasesDocuments(CourtCase updateCase, CourtCase existingCase) {
        List<Document> documentsToDelete = new ArrayList<>();
        if (existingCase.getLinkedCases() != null) {
            for (LinkedCase existingLinked : existingCase.getLinkedCases()) {
                LinkedCase updateLinked = findById(updateCase.getLinkedCases(), existingLinked.getId(), LinkedCase::getId);
                if (updateLinked != null) {
                    documentsToDelete.addAll(processDocumentDifferences(
                            updateLinked.getDocuments(), existingLinked.getDocuments(), updateLinked.getDocuments()));
                }
            }
        }
        return documentsToDelete;
    }

    private <T, ID> T findById(List<T> list, ID id, Function<T, ID> idExtractor) {
        if (list == null || id == null) return null;
        return list.stream()
                .filter(item -> id.equals(idExtractor.apply(item)))
                .findFirst()
                .orElse(null);
    }

    private List<Document> processDocumentDifferences(List<Document> updatedDocs, List<Document> existingDocs, List<Document> targetList) {
        if (existingDocs == null) {
            return Collections.emptyList();
        }

        Set<String> updatedFileStores = updatedDocs == null ? Collections.emptySet() :
                updatedDocs.stream()
                        .map(Document::getFileStore)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet());

        List<Document> removedDocuments = existingDocs.stream()
                .filter(existingDoc -> !updatedFileStores.contains(existingDoc.getFileStore()))
                .toList();

        removedDocuments.forEach(doc -> {
            doc.setIsActive(false);
            if (targetList != null) {
                targetList.add(doc);
            }
        });

        return removedDocuments;
    }

    private <T> void filterDocuments(List<T> entities,
                                     Function<T, List<Document>> getDocs,
                                     BiConsumer<T, List<Document>> setDocs) {
        if (entities == null) return;

        for (T entity : entities) {
            List<Document> docs = getDocs.apply(entity);
            if (docs != null) {
                List<Document> activeDocs = docs.stream()
                        .filter(Document::getIsActive)
                        .collect(Collectors.toList());
                setDocs.accept(entity, activeDocs); // ✅ set it back
            }
        }
    }

    private void removeInactiveDocuments(List<Document> documentsToDelete) {
        List<String> fileStoreIds = new ArrayList<>();
        for (Document document : documentsToDelete) {
            if (!document.getIsActive()) {
                fileStoreIds.add(document.getFileStore());
            }
        }
        if (!fileStoreIds.isEmpty()) {
            fileStoreUtil.deleteFilesByFileStore(fileStoreIds, config.getTenantId());
            log.info("Deleted files for case with ids: {}", fileStoreIds);
        }
    }

    private Object createHearingUpdateRequest(CaseRequest caseRequest) {
        Map<String, Object> hearingUpdateRequest = new HashMap<>();
        hearingUpdateRequest.put("requestInfo", caseRequest.getRequestInfo());
        hearingUpdateRequest.put("filingNumber", caseRequest.getCases().getFilingNumber());
        hearingUpdateRequest.put("cmpNumber", caseRequest.getCases().getCmpNumber());
        hearingUpdateRequest.put("courtCaseNumber", caseRequest.getCases().getCourtCaseNumber());
        hearingUpdateRequest.put("caseTitle", caseRequest.getCases().getCaseTitle());
        hearingUpdateRequest.put("tenantId", caseRequest.getCases().getTenantId());
        hearingUpdateRequest.put("courtId", caseRequest.getCases().getCourtId());
        return hearingUpdateRequest;
    }

    private Boolean checkItsLastSign(CaseRequest caseRequest) {

        if (E_SIGN.equalsIgnoreCase(caseRequest.getCases().getWorkflow().getAction())) {

            log.info("Method=checkItsLastSign, Result= IN_ProgressChecking if its last e-sign for case {}", caseRequest.getCases().getId());

            CourtCase cases = caseRequest.getCases();
            // Check if all litigants have signed or any poa of litigant has signed
            // get all litigant and their poa

            Map<String, List<POAHolder>> litigantPoaMap = caseUtil.getLitigantPoaMapping(cases);

            //check if all litigant signed or any poa (if exists) of litigant has signed
            boolean allLitigantsSigned = cases.getLitigants().stream()
                    .filter(Party::getIsActive)
                    .allMatch(litigant -> {
                        // Check if the litigant has signed directly
                        if (Boolean.TRUE.equals(litigant.getHasSigned())) {
                            return true;
                        }

                        // Check if any POA holder for this litigant has signed
                        String litigantId = litigant.getIndividualId();
                        if (litigantId != null && litigantPoaMap.containsKey(litigantId)) {
                            return litigantPoaMap.get(litigantId).stream()
                                    .anyMatch(poa -> Boolean.TRUE.equals(poa.getHasSigned()));
                        }

                        // No POA or litigant hasn't signed
                        return false;
                    });

            // If any litigant or any POA hasn't signed, return false immediately
            if (!allLitigantsSigned) {
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

            enrichmentUtil.enrichStatuteAndSectionsOnCreateAndUpdate(caseRequest.getCases(), caseRequest.getCases().getAuditdetails());
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

    public void callNotificationService(CaseRequest caseRequest, String messageCode, String profileEditorId) {
        try {
            CourtCase courtCase = caseRequest.getCases();
            Set<String> IndividualIds = getLitigantIndividualId(courtCase);
            getAdvocateIndividualId(caseRequest, IndividualIds);
            getPocHolderIndividualIds(caseRequest, IndividualIds);
            Set<String> phonenumbers = callIndividualService(caseRequest.getRequestInfo(), IndividualIds);
            SmsTemplateData smsTemplateData = enrichSmsTemplateData(caseRequest.getCases(), profileEditorId);
            for (String number : phonenumbers) {
                notificationService.sendNotification(caseRequest.getRequestInfo(), smsTemplateData, messageCode, number);
            }
        } catch (Exception e) {
            // Log the exception and continue the execution without throwing
            log.error("Error occurred while sending notification: {}", e.toString());
        }
    }

    private void getPocHolderIndividualIds(CaseRequest caseRequest, Set<String> individualIds) {
        Set<String> pocHolderId = new HashSet<>();
        CourtCase courtCase = caseRequest.getCases();
        if (courtCase.getPoaHolders() != null) {
            pocHolderId.addAll(
                    courtCase.getPoaHolders().stream()
                            .filter(POAHolder::getIsActive)
                            .map(POAHolder::getIndividualId)
                            .collect(Collectors.toSet())
            );
        }
        individualIds.addAll(pocHolderId);
    }

    public Set<String> getPocHolderIndividualIdsOfLitigants(CourtCase courtCase, Set<String> individualIds) {
        // get poa holders of litigants
        if (courtCase.getPoaHolders() != null) {
            Set<String> matchingPocHolderIds = courtCase.getPoaHolders().stream()
                    .filter(poa -> Boolean.TRUE.equals(poa.getIsActive()))
                    .filter(poa -> poa.getRepresentingLitigants() != null &&
                            poa.getRepresentingLitigants().stream()
                                    .map(PoaParty::getIndividualId)
                                    .anyMatch(individualIds::contains))
                    .map(POAHolder::getIndividualId)
                    .collect(Collectors.toSet());
            individualIds.addAll(matchingPocHolderIds);
        }
        return individualIds;
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
            individualIds.addAll(advocateUtil.getAdvocate(caseRequest.getRequestInfo(), advocateId.stream().toList()));
        }
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

    private SmsTemplateData enrichSmsTemplateData(CourtCase cases, String profileEditorId) {
        return SmsTemplateData.builder()
                .courtCaseNumber(cases.getCourtCaseNumber())
                .cnrNumber(cases.getCnrNumber())
                .cmpNumber(cases.getCmpNumber())
                .efilingNumber(cases.getFilingNumber())
                .advocateName(profileEditorId != null ? extractProfileEditorName(profileEditorId, cases) : null)
                .tenantId(cases.getTenantId()).build();
    }

    private String extractProfileEditorName(String profileEditorId, CourtCase cases) {
        List<AdvocateMapping> advocateMappings = cases.getRepresentatives();
        for (AdvocateMapping advocateMapping : advocateMappings) {
            JsonNode additionalDetails = objectMapper.convertValue(advocateMapping.getAdditionalDetails(), JsonNode.class);
            if (additionalDetails.get("uuid").asText().equals(profileEditorId)) {
                return additionalDetails.get("advocateName").asText();
            }
        }
        List<Party> litigants = cases.getLitigants();
        for (Party litigant : litigants) {
            JsonNode additionalDetails = objectMapper.convertValue(litigant.getAdditionalDetails(), JsonNode.class);
            if (additionalDetails.get("uuid").asText().equals(profileEditorId)) {
                return additionalDetails.get("fullName").asText();
            }
        }
        return null;
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

    private String getNotificationStatus(String previousStatus, String updatedStatus) {
        if (updatedStatus.equalsIgnoreCase(PENDING_E_SIGN)) {
            return ESIGN_PENDING;
        } else if (updatedStatus.equalsIgnoreCase(PAYMENT_PENDING)) {
            return CASE_SUBMITTED;
        } else if (previousStatus.equalsIgnoreCase(UNDER_SCRUTINY) && updatedStatus.equalsIgnoreCase(PENDING_REGISTRATION)) {
            return CASE_FORWARDED_TO_JUDGE;
        } else if (previousStatus.equalsIgnoreCase(UNDER_SCRUTINY) && updatedStatus.equalsIgnoreCase(CASE_REASSIGNED)) {
            return FSO_SEND_BACK;
        } else if (previousStatus.equalsIgnoreCase(PENDING_REGISTRATION) && updatedStatus.equalsIgnoreCase(PENDING_RESPONSE)) {
            return CASE_REGISTERED;
        } else if (previousStatus.equalsIgnoreCase(PENDING_REGISTRATION) && updatedStatus.equalsIgnoreCase(CASE_REASSIGNED)) {
            return JUDGE_SEND_BACK_E_SIGN_CODE;
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
            CourtCase courtCase = courtCaseList.get(0);

            if (courtCase != null) {
                caseObj.setAuditdetails(courtCase.getAuditdetails());
            }
            caseObj.setAdditionalDetails(addWitnessRequest.getAdditionalDetails());
            caseObj = encryptionDecryptionUtil.encryptObject(caseObj, config.getCourtCaseEncrypt(), CourtCase.class);

            addWitnessRequest.setAdditionalDetails(caseObj.getAdditionalDetails());
            producer.push(config.getAdditionalJoinCaseTopic(), addWitnessRequest);

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

            return JoinCaseResponse.builder().joinCaseRequest(joinCaseRequest).build();

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Invalid request for joining a case :: {}", e.toString());
            throw new CustomException(JOIN_CASE_ERR, JOIN_CASE_INVALID_REQUEST);
        }
    }

    public JoinCaseV2Response processJoinCaseRequest(JoinCaseV2Request joinCaseRequest) {
        JoinCaseV2Response joinCaseV2Response = new JoinCaseV2Response();
        try {
            String filingNumber = joinCaseRequest.getJoinCaseData().getFilingNumber();
            List<CaseCriteria> existingCases = caseRepository.getCases(Collections.singletonList(CaseCriteria.builder().filingNumber(filingNumber).build()), joinCaseRequest.getRequestInfo());
            log.info("Existing case list size :: {}", existingCases.size());

            CourtCase courtCase = validateAccessCodeAndReturnCourtCase(joinCaseRequest, existingCases);

            CourtCase caseObj = CourtCase.builder()
                    .id(courtCase.getId())
                    .filingNumber(courtCase.getFilingNumber())
                    .build();

            JoinCaseDataV2 joinCaseData = joinCaseRequest.getJoinCaseData();

            AuditDetails auditDetails = AuditDetails.builder()
                    .createdBy(joinCaseRequest.getRequestInfo().getUserInfo().getUuid())
                    .createdTime(System.currentTimeMillis())
                    .lastModifiedBy(joinCaseRequest.getRequestInfo().getUserInfo().getUuid())
                    .lastModifiedTime(System.currentTimeMillis()).build();

            //For litigant join case
            if (joinCaseData.getLitigant() != null && !joinCaseData.getLitigant().isEmpty()) {

                if (!validator.validateLitigantJoinCase(joinCaseRequest))
                    throw new CustomException(VALIDATION_ERR, JOIN_CASE_INVALID_REQUEST);

                validateLitigantAlreadyPartOfCase(courtCase, joinCaseData);

                addLitigantToCase(joinCaseRequest, courtCase, caseObj, auditDetails);
            }

            //For advocate join case
            if (joinCaseData.getRepresentative() != null) {

                if (!validator.validateRepresentativeJoinCase(joinCaseRequest))
                    throw new CustomException(VALIDATION_ERR, JOIN_CASE_INVALID_REQUEST);

                //To check if advocate is already representing the individual and return existingRepresentative if advocate is part of  the case
                AdvocateMapping existingRepresentative = validateAdvocateAlreadyRepresenting(courtCase, joinCaseData);

                List<Calculation> calculationList = getPaymentCalculations(joinCaseRequest, joinCaseData, courtCase);
                List <RepresentingJoinCase> representingList = Optional.ofNullable(joinCaseRequest)
                        .map(JoinCaseV2Request::getJoinCaseData)
                        .map(JoinCaseDataV2::getRepresentative)
                        .map(JoinCaseRepresentative::getRepresenting)
                        .orElse(Collections.emptyList());

                for (RepresentingJoinCase representing : representingList) {
                    List<Document> documents = representing.getDocuments();

                    if (documents == null || documents.isEmpty()) {
                        log.debug("No documents found for representing: {}", representing.getUniqueId());
                        continue;
                    }

                    for (Document document : documents) {
                        try {
                            processVakalatnamaDocument(document, courtCase, joinCaseRequest);
                        } catch (Exception e) {
                            log.error("Failed to process document: {}", document.getId(), e);
                        }
                    }
                }
                if (calculationList != null && !calculationList.isEmpty() && calculationList.get(0).getTotalAmount() > 0) {
                    String taskNumber = createTaskAndDemand(joinCaseRequest, calculationList);
                    return JoinCaseV2Response.builder().paymentTaskNumber(taskNumber).build();
                } else {
                    joinCaseAdvocate(joinCaseRequest, courtCase, caseObj, auditDetails, existingRepresentative);
                }
            }

            //for poa join case
            if (joinCaseData.getPoa() != null) {
                validator.validatePOAJoinCase(courtCase, joinCaseRequest.getJoinCaseData());
                Individual poaIndividual = validator.validatePOAIndividual(joinCaseRequest);
                TaskResponse taskResponse = createTaskForJudgePOA(joinCaseRequest, poaIndividual);
                joinCaseV2Response.setPaymentTaskNumber(taskResponse.getTask().getTaskNumber());
            }

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Invalid join case request :: {}", e.toString());
            throw new CustomException(JOIN_CASE_ERR, JOIN_CASE_INVALID_REQUEST);
        }
        joinCaseV2Response.setIsVerified(true);
        return joinCaseV2Response;
    }

    private void processVakalatnamaDocument(Document document, CourtCase courtCase, JoinCaseV2Request joinCaseRequest) {
        if (!isDocumentVakalatnama(document)) {
            log.debug("Document {} is not Vakalatnama, skipping", document.getId());
            return;
        }

        log.info("Processing Vakalatnama document: {} for case: {}", document.getId(), courtCase.getFilingNumber());

        // Get hearing date
        String hearingDate = getHearingDateString(courtCase.getFilingNumber());

        // Build SMS template
        SmsTemplateData smsTemplateData = SmsTemplateData.builder()
                .cmpNumber(courtCase.getCmpNumber())
                .courtCaseNumber(courtCase.getCourtCaseNumber())
                .tenantId(courtCase.getTenantId())
                .hearingDate(hearingDate)
                .build();

        log.debug("SMS Template Data: {}", smsTemplateData);

        // Collect UUIDs
        List<String> uuids = collectUserUuids(courtCase);
        log.info("Collected {} user UUIDs", uuids.size());

        if (uuids.isEmpty()) {
            log.warn("No UUIDs found for case: {}", courtCase.getFilingNumber());
            return;
        }

        // Get individuals and send notifications
        sendVakalatnamaNotifications(joinCaseRequest.getRequestInfo(), uuids, smsTemplateData);
    }

    private String getHearingDateString(String filingNumber) {
        try {
            return String.valueOf(getNextHearingDate(filingNumber));
        } catch (Exception e) {
            log.error("Failed to get next hearing date for filing: {}", filingNumber, e);
            return "N/A";
        }
    }

    private List<String> collectUserUuids(CourtCase courtCase) {
        List<String> uuids = new ArrayList<>();

        // Collect advocate UUIDs
        if (courtCase.getRepresentatives() != null) {
            courtCase.getRepresentatives().forEach(advocate -> {
                try {
                    String uuid = extractUuidFromAdditionalDetails(advocate);
                    if (uuid != null && !uuid.isEmpty()) {
                        uuids.add(uuid);
                        log.debug("Added advocate UUID: {}", uuid);
                    }
                } catch (Exception e) {
                    log.error("Failed to extract UUID from advocate: {}", advocate, e);
                }
            });
        }

        // Collect litigant UUIDs
        if (courtCase.getLitigants() != null) {
            courtCase.getLitigants().forEach(litigant -> {
                try {
                    String uuid = extractUuidFromAdditionalDetails(litigant);
                    if (uuid != null && !uuid.isEmpty()) {
                        uuids.add(uuid);
                        log.debug("Added litigant UUID: {}", uuid);
                    }
                } catch (Exception e) {
                    log.error("Failed to extract UUID from litigant: {}", litigant, e);
                }
            });
        }

        return uuids;
    }

    private String extractUuidFromAdditionalDetails(Object entity) {
        JsonNode node = objectMapper.convertValue(entity, JsonNode.class);
        JsonNode uuidNode = node.path("additionalDetails").path("uuid");

        if (uuidNode.isMissingNode() || uuidNode.isNull()) {
            log.warn("UUID not found in additionalDetails for entity: {}", entity.getClass().getSimpleName());
            return null;
        }

        return uuidNode.asText();
    }

    private void sendVakalatnamaNotifications(RequestInfo requestInfo, List<String> uuids, SmsTemplateData smsTemplateData) {
        List<Individual> individuals;

        try {
            individuals = individualService.getIndividuals(requestInfo, uuids);
        } catch (Exception e) {
            log.error("Failed to fetch individuals for UUIDs: {}", uuids, e);
            return;
        }

        if (individuals == null || individuals.isEmpty()) {
            log.warn("No individuals found for UUIDs: {}", uuids);
            return;
        }

        log.info("Sending notifications to {} individuals", individuals.size());

        individuals.forEach(individual -> {
            try {
                if (individual.getMobileNumber() == null || individual.getMobileNumber().isEmpty()) {
                    log.warn("Mobile number missing for individual UUID: {}", individual.getIndividualId());
                    return;
                }

                notificationService.sendNotification(
                        requestInfo,
                        smsTemplateData,
                        VAKALATNAMA_FILED,
                        individual.getMobileNumber()
                );

                log.info("Notification sent to: {}", individual.getMobileNumber());
            } catch (Exception e) {
                log.error("Failed to send notification to individual: {}", individual.getIndividualId(), e);
            }
        });
    }

    private boolean isDocumentVakalatnama(Document document) {
        if (document.getAdditionalDetails() instanceof Map<?, ?> additionalDetailsMap) {
            Object docName = additionalDetailsMap.get("documentName");
            return VAKALATNAMA.equalsIgnoreCase(String.valueOf(docName));
        }
        return false;
    }

    private LocalDate getNextHearingDate(String filingNumber) {
        HearingCriteria criteria = HearingCriteria.builder()
                .filingNumber(filingNumber)
                .status(SCHEDULED)
                .build();

        HearingSearchRequest hearingSearchRequest = HearingSearchRequest.builder()
                .criteria(criteria)
                .pagination(null)
                .build();

        List<Hearing> hearings = hearingUtil.fetchHearingDetails(hearingSearchRequest);
        if(!hearings.isEmpty()){
            Long startTime = hearings.get(0).getStartTime();
            return dateUtil.getLocalDateFromEpoch(startTime);
        }
        return null;
    }

    private List<Calculation> getPaymentCalculations(JoinCaseV2Request joinCaseRequest, JoinCaseDataV2 joinCaseData, CourtCase courtCase) {
        List<LitigantAdvocateMap> litigantAdvocateMapList = new ArrayList<>();

        joinCaseData.getRepresentative().getRepresenting().forEach(representing -> {
            LitigantAdvocateMap litigantAdvocateMap = LitigantAdvocateMap.builder().build();
            litigantAdvocateMap.setAdvocateCount(representing.getNoOfAdvocates());
            litigantAdvocateMap.setLitigantId(representing.getIndividualId());
            litigantAdvocateMap.setAdvocateId(Collections.singletonList(joinCaseData.getRepresentative().getAdvocateId()));
            litigantAdvocateMapList.add(litigantAdvocateMap);
        });
        JoinCasePaymentRequest joinCasePaymentRequest = JoinCasePaymentRequest.builder().build();
        joinCasePaymentRequest.setRequestInfo(joinCaseRequest.getRequestInfo());

        JoinCaseCriteria criteria = JoinCaseCriteria.builder()
                .caseId(String.valueOf(courtCase.getId()))
                .filingNumber(joinCaseData.getFilingNumber())
                .tenantId(joinCaseData.getTenantId())
                .litigantAdvocateMap(litigantAdvocateMapList)
                .build();
        joinCasePaymentRequest.setJoinCaseCriteria(Collections.singletonList(criteria));

        CalculationRes calculationRes = paymentCalculaterUtil.callPaymentCalculator(joinCasePaymentRequest);
        return calculationRes.getCalculation();
    }

    public void joinCaseAdvocate(JoinCaseV2Request joinCaseRequest, CourtCase courtCase, CourtCase caseObj, AuditDetails auditDetails, AdvocateMapping existingRepresentative) {
        if (joinCaseRequest.getJoinCaseData().getRepresentative().getIsReplacing()) {
            for (RepresentingJoinCase representingJoinCase : joinCaseRequest.getJoinCaseData().getRepresentative().getRepresenting()) {
                if (!isValidReplacement(courtCase, joinCaseRequest.getJoinCaseData().getRepresentative(), representingJoinCase)) {
                    log.info("Not a valid request for replacement");
                    return;
                }
            }
            replaceAdvocate(joinCaseRequest, courtCase, joinCaseRequest.getJoinCaseData().getRepresentative().getAdvocateId());

        } else {
            checkIfRepresentingPipAndUpdateAdditionalDetails(joinCaseRequest, courtCase);
            addAdvocateToCase(joinCaseRequest, caseObj, courtCase, auditDetails, existingRepresentative);
            joinCaseNotificationsForDirectJoinOfAdvocate(joinCaseRequest, courtCase);
        }
    }

    //Check if representing is pip and updated pip related info from additional details and remove pip affidavit document from litigants document
    private void checkIfRepresentingPipAndUpdateAdditionalDetails(JoinCaseV2Request joinCaseRequest, CourtCase courtCase) {
        List<String> individualIdsOfAllPIP = Optional.ofNullable(courtCase.getLitigants())
                .orElse(Collections.emptyList())
                .stream().filter(litigant -> isPIP(litigant, courtCase)).map(Party::getIndividualId).toList();

        for (RepresentingJoinCase representingJoinCase : joinCaseRequest.getJoinCaseData().getRepresentative().getRepresenting()) {
            if (individualIdsOfAllPIP.contains(representingJoinCase.getIndividualId())) {
                //update additional details
                modifyAdditionalDetailsForPIP(courtCase, representingJoinCase.getIndividualId());

                for (Party litigant : courtCase.getLitigants()) {
                    if (litigant.getIndividualId().equals(representingJoinCase.getIndividualId()) && litigant.getDocuments() != null && !litigant.getDocuments().isEmpty()) {
                        // Filter out PIP affidavit documents
                        for (Document document : litigant.getDocuments()) {
                            Object additionalDetails = document.getAdditionalDetails();
                            if (additionalDetails == null) continue;

                            ObjectNode additionalDetailsNode = objectMapper.convertValue(additionalDetails, ObjectNode.class);
                            String documentName = additionalDetailsNode.has("documentName")
                                    ? additionalDetailsNode.get("documentName").asText()
                                    : "";

                            // If this is the PIP affidavit, mark inactive
                            if (UPLOAD_PIP_AFFIDAVIT.equalsIgnoreCase(documentName)) {
                                document.setIsActive(false);

                                CourtCase caseObjForPipDocumentInActive = new CourtCase();
                                caseObjForPipDocumentInActive.setId(courtCase.getId());
                                caseObjForPipDocumentInActive.setTenantId(courtCase.getTenantId());
                                caseObjForPipDocumentInActive.setLitigants(List.of(litigant));
                                log.info("Pushing join case litigant details for removing pip documents :: {}", caseObjForPipDocumentInActive);
                                producer.push(config.getLitigantJoinCaseTopic(), caseObjForPipDocumentInActive);
                                litigant.getDocuments().remove(document);
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    private boolean isPIP(Party litigant, CourtCase courtCase) {
        if (litigant.getPartyType().contains("complainant")) {
            if (courtCase.getRepresentatives() != null && !courtCase.getRepresentatives().isEmpty()) {
                for (AdvocateMapping mapping : courtCase.getRepresentatives()) {
                    Party litigantParty = mapping.getRepresenting().stream()
                            .filter(party -> party.getIndividualId().equalsIgnoreCase(litigant.getIndividualId()) && party.getIsActive())
                            .findFirst()
                            .orElse(null);

                    // If litigant is actively represented by an advocate, they're not self-represented
                    if (litigantParty != null) {
                        return false;
                    }
                }
            }
            return true;
        } else {
            if (litigant.getDocuments() != null && !litigant.getDocuments().isEmpty()) {
                for (Document document : litigant.getDocuments()) {
                    Object additionalDetails = document.getAdditionalDetails();
                    ObjectNode additionalDetailsNode = objectMapper.convertValue(additionalDetails, ObjectNode.class);
                    String documentName = additionalDetailsNode.has("documentName")
                            ? additionalDetailsNode.get("documentName").asText()
                            : "";
                    if (UPLOAD_PIP_AFFIDAVIT.equals(documentName)) {
                        return true;
                    }
                }
            }
            return false;
        }
    }

    //for updating pip related info from additional details
    private void modifyAdditionalDetailsForPIP(CourtCase courtCase, String individualIdPIPRepresenting) {
        ObjectNode additionalDetailsNode = objectMapper.convertValue(courtCase.getAdditionalDetails(), ObjectNode.class);

        try {
            if (additionalDetailsNode.has("advocateDetails")) {
                ObjectNode advocateDetails = (ObjectNode) additionalDetailsNode.get("advocateDetails");

                if (advocateDetails.has("formdata") && advocateDetails.get("formdata").isArray()) {
                    ArrayNode formData = (ArrayNode) advocateDetails.get("formdata");

                    for (JsonNode formDataItem : formData) {
                        if (!formDataItem.has("data")) continue;
                        ObjectNode dataNode = (ObjectNode) formDataItem.get("data");

                        if (!dataNode.has("multipleAdvocatesAndPip")) continue;
                        ObjectNode multipleAdvocatesAndPip = (ObjectNode) dataNode.get("multipleAdvocatesAndPip");

                        if (!multipleAdvocatesAndPip.has("boxComplainant")) continue;
                        ObjectNode boxComplainant = (ObjectNode) multipleAdvocatesAndPip.get("boxComplainant");

                        if (!boxComplainant.has("individualId") || !boxComplainant.get("individualId").asText().equalsIgnoreCase(individualIdPIPRepresenting)) {
                            continue;
                        }

                        ObjectNode isComplainantPipNode = objectMapper.createObjectNode();
                        isComplainantPipNode.put("code", "NO");
                        isComplainantPipNode.put("name", "No");
                        isComplainantPipNode.put("isEnabled", true);
                        multipleAdvocatesAndPip.set("isComplainantPip", isComplainantPipNode);

                        multipleAdvocatesAndPip.putNull("pipAffidavitFileUpload");
                    }
                }
            }

            courtCase.setAdditionalDetails(objectMapper.convertValue(additionalDetailsNode, Object.class));

        } catch (Exception e) {
            log.error("Error modifying additionalDetails for pip: {}", e.getMessage(), e);
        }
    }


    private boolean isValidReplacement(CourtCase courtCase, JoinCaseRepresentative representative, RepresentingJoinCase representingJoinCase) {
        String litigantId = representingJoinCase.getIndividualId();

        if (representingJoinCase.getIsAlreadyPip()) {
            return isValidPipLitigantReplacement(litigantId, courtCase);
        } else {
            return isValidAdvocateReplacement(courtCase, representative, representingJoinCase);
        }
    }

    private boolean isLitigantStillSelfRepresented(String litigantId, List<AdvocateMapping> advocateMappings) {
        log.info("operation=isLitigantStillSelfRepresented, status=IN_PROGRESS, litigantId , advocateMappings: {} , {}", litigantId, advocateMappings);
        if (advocateMappings != null) {
            for (AdvocateMapping mapping : advocateMappings) {
                Party litigantParty = mapping.getRepresenting().stream()
                        .filter(party -> party.getIndividualId().equalsIgnoreCase(litigantId) && party.getIsActive())
                        .findFirst()
                        .orElse(null);

                // If litigant is actively represented by an advocate, they're not self-represented
                if (litigantParty != null) {
                    log.info("operation=isLitigantStillSelfRepresented, status=FAILURE, litigantId , advocateMappings: {} , {}, {}", litigantId, advocateMappings, litigantParty);
                    return false;
                }
            }
        }
        log.info("operation=isLitigantStillSelfRepresented, status=SUCCESS, litigantId , advocateMappings: {} ,{}", litigantId, advocateMappings);
        return true;
    }

    private boolean isValidPipLitigantReplacement(String litigantId, CourtCase courtCase) {
        log.info("operation=isValidPipLitigantReplacement, status=IN_PROGRESS, litigantId , courtCase: {} , {}", litigantId, courtCase);
        // Check if litigant exists and is active
        Party litigant = Optional.ofNullable(courtCase.getLitigants())
                .orElse(Collections.emptyList())
                .stream()
                .filter(party -> party.getIndividualId().equalsIgnoreCase(litigantId) && party.getIsActive())
                .findFirst()
                .orElse(null);

        if (litigant == null) {
            log.info("operation=isValidPipLitigantReplacement, status=FAILURE, litigantId , courtCase: {} , {}", litigantId, courtCase);
            return false;
        }
        // Check if litigant is still self-represented (PIP)
        return isLitigantStillSelfRepresented(litigantId, courtCase.getRepresentatives());
    }

    private boolean isValidAdvocateReplacement(CourtCase courtCase, JoinCaseRepresentative representative, RepresentingJoinCase representingJoinCase) {
        log.info("operation=isValidAdvocateReplacement, status=IN_PROGRESS, advocate details , courtCase: {} , {}", representative, courtCase);
        String newAdvocateId = representative.getAdvocateId();
        String litigantId = representingJoinCase.getIndividualId();

        List<String> advocateIds = representingJoinCase.getReplaceAdvocates();

        // Check if the advocate exists and is active
        for (String advocateId : advocateIds) {
            AdvocateMapping advocateMapping = Optional.ofNullable(courtCase.getRepresentatives())
                    .orElse(Collections.emptyList()).stream()
                    .filter(mapping -> advocateId.equalsIgnoreCase(mapping.getAdvocateId()) && mapping.getIsActive()).findFirst().orElse(null);

            if (advocateMapping == null) {
                log.info("operation=isValidAdvocateReplacement, status=FAILURE, replacement details , courtCase: {} , {}", advocateMapping, courtCase);
                return false;
            }

            // Check if the advocate is representing the specified litigant and the litigant is active
            if (!isAdvocateRepresentingActiveLitigant(advocateMapping, litigantId)) {
                log.info("operation=isValidAdvocateReplacement, status=FAILURE, replacement details , courtCase, advocateMapping: {} , {}, {}", representative, courtCase, advocateMapping);
                return false;
            }
        }
        // Check if the replacement advocate is already representing the litigant in another task
        return !isAdvocateAlreadyRepresentingLitigant(newAdvocateId, litigantId, courtCase.getRepresentatives());
    }

    private boolean isAdvocateRepresentingActiveLitigant(AdvocateMapping advocateMapping, String litigantId) {
        return advocateMapping.getRepresenting().stream()
                .anyMatch(party -> party.getIndividualId().equalsIgnoreCase(litigantId) && party.getIsActive());
    }

    private boolean isAdvocateAlreadyRepresentingLitigant(String advocateId, String litigantId, List<AdvocateMapping> advocateMappings) {
        if (advocateMappings != null) {
            for (AdvocateMapping mapping : advocateMappings) {
                if (mapping.getAdvocateId().equalsIgnoreCase(advocateId)) {
                    Party litigantParty = mapping.getRepresenting().stream()
                            .filter(party -> party.getIndividualId().equalsIgnoreCase(litigantId) && party.getIsActive())
                            .findFirst()
                            .orElse(null);

                    if (litigantParty != null) {
                        log.info("operation=isAdvocateAlreadyRepresentingLitigant, status=SUCCESS, advocateId, litigantId , {} , {}", advocateId, litigantId);
                        return true;
                    }
                }
            }
        }
        log.info("operation=isAdvocateAlreadyRepresentingLitigant, status=FAILURE, advocateId, litigantId , {} , {}", advocateId, litigantId);
        return false;
    }

    public AdvocateMapping validateAdvocateAlreadyRepresenting(CourtCase courtCase, JoinCaseDataV2 joinCaseData) {
        // Stream over the representatives to create a list of advocateIds
        List<String> advocateIds = Optional.ofNullable(courtCase.getRepresentatives())
                .orElse(Collections.emptyList())
                .stream()
                .map(AdvocateMapping::getAdvocateId)
                .toList();
        AdvocateMapping existingRepresentative = null;

        // If advocate is already representing the individual throw exception
        if (!advocateIds.isEmpty() && advocateIds.contains(joinCaseData.getRepresentative().getAdvocateId())) {

            Optional<AdvocateMapping> existingRepresentativeOptional = courtCase.getRepresentatives().stream()
                    .filter(advocateMapping -> joinCaseData.getRepresentative().getAdvocateId().equals(advocateMapping.getAdvocateId()))
                    .findFirst();

            if (existingRepresentativeOptional.isEmpty())
                throw new CustomException(INVALID_ADVOCATE_ID, INVALID_ADVOCATE_DETAILS);

            existingRepresentative = existingRepresentativeOptional.get();
            List<String> individualIdList = existingRepresentative.getRepresenting().stream()
                    .map(Party::getIndividualId)
                    .toList();

            joinCaseData.getRepresentative().getRepresenting().forEach(representing -> {
                if (individualIdList.contains(representing.getIndividualId())) {
                    log.info("Advocate is already representing the individual");
                    throw new CustomException(VALIDATION_ERR, "Advocate is already representing the individual");
                }
            });

        }
        return existingRepresentative;
    }

    private void addAdvocateToCase(JoinCaseV2Request joinCaseRequest, CourtCase caseObj, CourtCase courtCase, AuditDetails auditDetails, AdvocateMapping existingRepresentative) {
        JoinCaseDataV2 joinCaseData = joinCaseRequest.getJoinCaseData();

        Map<String, Party> individualPartyMap = new HashMap<>();

        if (joinCaseData.getLitigant() != null && !joinCaseData.getLitigant().isEmpty()) {
            joinCaseData.getLitigant().forEach(joinCaseLitigant -> {
                if (!individualPartyMap.containsKey(joinCaseLitigant.getIndividualId())) {
                    Party litigant = new Party();
                    litigant.setPartyCategory(joinCaseLitigant.getPartyCategory());
                    litigant.setPartyType(joinCaseLitigant.getPartyType());
                    individualPartyMap.put(joinCaseLitigant.getIndividualId(), litigant);
                }
            });
        }
        Optional.ofNullable(courtCase.getLitigants()).orElse(Collections.emptyList()).forEach(existingLitigant -> {
            if (!individualPartyMap.containsKey(existingLitigant.getIndividualId())) {
                Party litigant = new Party();
                litigant.setPartyCategory(existingLitigant.getPartyCategory());
                litigant.setPartyType(existingLitigant.getPartyType());
                individualPartyMap.put(existingLitigant.getIndividualId(), litigant);
            }
        });

        if (existingRepresentative != null) {
            joinCaseData.getRepresentative().getRepresenting().forEach(representingJoinCase -> {
                Party party = new Party();
                party.setPartyType(individualPartyMap.get(representingJoinCase.getIndividualId()).getPartyType());
                party.setPartyCategory(individualPartyMap.get(representingJoinCase.getIndividualId()).getPartyCategory());

                party.setIndividualId(representingJoinCase.getIndividualId());

                List<Individual> individualsList = individualService.getIndividualsByIndividualId(joinCaseRequest.getRequestInfo(), representingJoinCase.getIndividualId());
                Individual individual = individualsList.get(0);

                ObjectNode additionalDetails = objectMapper.createObjectNode();

                additionalDetails.put("uuid", individual.getUserUuid());

                if (representingJoinCase.getUniqueId() != null) {
                    //respondent name enrich
                    additionalDetails.put("fullName", getRespondentNameByUniqueId(courtCase.getAdditionalDetails(), representingJoinCase.getUniqueId(), individual));
                } else {
                    //complainant name enrich
                    additionalDetails.put("fullName", getComplainantNameByIndividualId(courtCase.getAdditionalDetails(), representingJoinCase.getIndividualId()));
                }
                Object additionalDetailsObject = objectMapper.convertValue(additionalDetails, additionalDetails.getClass());
                party.setAdditionalDetails(additionalDetailsObject);
                party.setCaseId(String.valueOf(courtCase.getId()));

                existingRepresentative.getRepresenting().add(party);

                boolean isEvidenceAlreadyPresent = evidenceValidator.validateEvidenceCreate(courtCase, joinCaseRequest.getRequestInfo(), representingJoinCase.getDocuments());

                if (!isEvidenceAlreadyPresent) {
                    enrichAndCallEvidenceCreate(courtCase, representingJoinCase, joinCaseRequest.getRequestInfo(), individualPartyMap.get(representingJoinCase.getIndividualId()).getPartyType());
                }

                courtCase.getRepresentatives().stream()
                        .filter(representative -> representative.getAdvocateId().equalsIgnoreCase(existingRepresentative.getAdvocateId()))
                        .findFirst()
                        .ifPresent(representative -> {
                            if (representative.getRepresenting() == null) {
                                representative.setRepresenting(new ArrayList<>()); // Ensure the list is initialized
                            }
                            representative.getRepresenting().add(party);
                        });
            });
            caseObj.setRepresentatives(List.of(existingRepresentative));

        } else {
            AdvocateMapping representative = new AdvocateMapping();
            representative.setTenantId(joinCaseData.getTenantId());
            representative.setAdvocateId(joinCaseData.getRepresentative().getAdvocateId());
            representative.setCaseId(String.valueOf(courtCase.getId()));
            List<Party> representingList = new ArrayList<>();

            AtomicBoolean isAccusedAdvocate = new AtomicBoolean(false);

            joinCaseData.getRepresentative().getRepresenting().forEach(representingJoinCase -> {
                Party party = new Party();
                party.setId(UUID.randomUUID());
                party.setIndividualId(representingJoinCase.getIndividualId());
                party.setPartyType(individualPartyMap.get(representingJoinCase.getIndividualId()).getPartyType());
                party.setPartyCategory(individualPartyMap.get(representingJoinCase.getIndividualId()).getPartyCategory());

                party.setCaseId(String.valueOf(courtCase.getId()));

                if (representingJoinCase.getDocuments() != null && !representingJoinCase.getDocuments().isEmpty()) {
                    Document document = new Document();
                    document.setFileStore(representingJoinCase.getDocuments().get(0).getFileStore());
                    document.setDocumentType(representingJoinCase.getDocuments().get(0).getFileStore());
                    document.setAdditionalDetails(representingJoinCase.getDocuments().get(0).getFileStore());
                    party.setDocuments(List.of(document));
                }

                List<Individual> individualsList = individualService.getIndividualsByIndividualId(joinCaseRequest.getRequestInfo(), representingJoinCase.getIndividualId());
                Individual individual = individualsList.get(0);

                ObjectNode additionalDetails = objectMapper.createObjectNode();

                additionalDetails.put("uuid", individual.getUserUuid());

                if (representingJoinCase.getUniqueId() != null) {
                    isAccusedAdvocate.set(true);
                    //respondent name enrich
                    additionalDetails.put("fullName", getRespondentNameByUniqueId(courtCase.getAdditionalDetails(), representingJoinCase.getUniqueId(), individual));
                } else {
                    //complainant name enrich
                    additionalDetails.put("fullName", getComplainantNameByIndividualId(courtCase.getAdditionalDetails(), representingJoinCase.getIndividualId()));
                }

                Object additionalDetailsObject = objectMapper.convertValue(additionalDetails, additionalDetails.getClass());
                party.setAdditionalDetails(additionalDetailsObject);
                representingList.add(party);

                boolean isEvidenceAlreadyPresent = evidenceValidator.validateEvidenceCreate(courtCase, joinCaseRequest.getRequestInfo(), representingJoinCase.getDocuments());

                if (!isEvidenceAlreadyPresent) {
                    enrichAndCallEvidenceCreate(courtCase, representingJoinCase, joinCaseRequest.getRequestInfo(), individualPartyMap.get(representingJoinCase.getIndividualId()).getPartyType());
                }

            });
            List<Advocate> advocatesList = advocateUtil.fetchAdvocatesById(joinCaseRequest.getRequestInfo(), joinCaseData.getRepresentative().getAdvocateId());
            Advocate joinCaseAdvocate = advocatesList.get(0);

            List<Individual> individualsList = individualService.getIndividualsByIndividualId(joinCaseRequest.getRequestInfo(), joinCaseAdvocate.getIndividualId());
            Individual individual = individualsList.get(0);

            ObjectNode additionalDetails = objectMapper.createObjectNode();

            additionalDetails.put("uuid", individual.getUserUuid());
            additionalDetails.put("advocateName", getName(individual));

            Object additionalDetailsObject = objectMapper.convertValue(additionalDetails, additionalDetails.getClass());
            representative.setAdditionalDetails(additionalDetailsObject);

            representative.setRepresenting(representingList);

            HearingCriteria hearingCriteria = HearingCriteria.builder()
                    .filingNumber(courtCase.getFilingNumber())
                    .build();
            List<Hearing> hearingList = getHearingsForCase(hearingCriteria);
            List<Hearing> scheduledHearings = hearingList.stream().filter(hearing -> hearing.getStatus().equalsIgnoreCase("SCHEDULED")).toList();
            Attendee newAttendee = new Attendee();
            newAttendee.setIndividualId(joinCaseAdvocate.getIndividualId());
            newAttendee.setName(getName(individual));
            newAttendee.setType("Advocate");
            scheduledHearings.forEach(hearing -> {
                Optional.ofNullable(hearing.getAttendees()).orElse(new ArrayList<>()).add(newAttendee);
                HearingRequest hearingRequest = new HearingRequest();
                joinCaseRequest.getRequestInfo().getUserInfo().getRoles().add(Role.builder().code("HEARING_SCHEDULER").name("HEARING_SCHEDULER").tenantId(joinCaseData.getTenantId()).build());
                hearingRequest.setRequestInfo(joinCaseRequest.getRequestInfo());
                hearingRequest.setHearing(hearing);
                hearingUtil.updateTranscriptAdditionalAttendees(hearingRequest);

                //update open hearing index
                updateHearingIndex(getName(individual),individual.getIndividualId(),isAccusedAdvocate,hearing,courtCase.getCourtId());
            });

            caseObj.setRepresentatives(List.of(representative));


            if (courtCase.getRepresentatives() == null) {
                courtCase.setRepresentatives(new ArrayList<>());
            }
            courtCase.getRepresentatives().add(representative);
        }

        log.info("enriching representatives");
        enrichRepresentativesOnCreateAndUpdate(caseObj, auditDetails);

        joinCaseRequest.getJoinCaseData().getRepresentative().getRepresenting().forEach(representingJoinCase -> {
            if (representingJoinCase.getUniqueId() == null) {
                courtCase.setAdditionalDetails(modifyAdditionalDetails(joinCaseRequest.getRequestInfo(), courtCase.getAdditionalDetails(), representingJoinCase, joinCaseData.getRepresentative()));
            }
        });

        log.info("Pushing join case representative details :: {}", caseObj);
        producer.push(config.getRepresentativeJoinCaseTopic(), caseObj);

        CourtCase encrptedCourtCase = encryptionDecryptionUtil.encryptObject(courtCase, config.getCourtCaseEncryptNew(), CourtCase.class);

        log.info("Pushing additional details :: {}", encrptedCourtCase);
        producer.push(config.getUpdateAdditionalJoinCaseTopic(), encrptedCourtCase);

        updateCourtCaseInRedis(joinCaseData.getTenantId(), encrptedCourtCase);

        publishToJoinCaseIndexer(joinCaseRequest.getRequestInfo(), encrptedCourtCase);
    }

    private void updateHearingIndex(String name, String individualId, AtomicBoolean isAccusedAdvocate, Hearing hearing,String courtId) {
        InboxRequest inboxRequest = inboxUtil.getInboxRequestForOpenHearing(courtId, String.valueOf(hearing.getId()));
        List<OpenHearing> openHearingList = inboxUtil.getOpenHearings(inboxRequest);
        if(openHearingList != null && !openHearingList.isEmpty()) {
            OpenHearing openHearing = openHearingList.get(0);
            Advocate advocate = openHearing.getAdvocate();
            if(isAccusedAdvocate.get()){
                if(advocate.getAccused()==null)
                    advocate.setAccused(new ArrayList<>());
                if(!advocate.getAccused().contains(name))
                    advocate.getAccused().add(name);
            }
            else{
                if(advocate.getComplainant()==null)
                    advocate.setComplainant(new ArrayList<>());
                if(!advocate.getComplainant().contains(name))
                    advocate.getComplainant().add(name);
            }
            if(!openHearing.getSearchableFields().contains(name)){
                openHearing.getSearchableFields().add(name);
            }
            if(!openHearing.getAdvocate().getIndividualIds().contains(individualId))
                openHearing.getAdvocate().getIndividualIds().add(individualId);
            producer.push(config.getOpenHearingTopic(), openHearing);
        }
    }

    private void updateHearingIndexForReplaceAdvocate(String name, String individualId, boolean isAccusedAdvocate, Hearing hearing,String courtId,List<String> namesToBeRemoved) {
        InboxRequest inboxRequest = inboxUtil.getInboxRequestForOpenHearing(courtId, String.valueOf(hearing.getId()));
        List<OpenHearing> openHearingList = inboxUtil.getOpenHearings(inboxRequest);
        if(openHearingList != null && !openHearingList.isEmpty()) {
            OpenHearing openHearing = openHearingList.get(0);
            Advocate advocate = openHearing.getAdvocate();
            if(isAccusedAdvocate){
                if(advocate.getAccused()==null)
                    advocate.setAccused(new ArrayList<>());
                if(!advocate.getAccused().contains(name))
                    advocate.getAccused().add(name);
                advocate.getAccused().removeAll(namesToBeRemoved);
            }
            else{
                if(advocate.getComplainant()==null)
                    advocate.setComplainant(new ArrayList<>());
                if(!advocate.getComplainant().contains(name))
                 advocate.getComplainant().add(name);
                advocate.getComplainant().removeAll(namesToBeRemoved);
            }
            if(!openHearing.getSearchableFields().contains(name)){
                openHearing.getSearchableFields().add(name);
            }
            openHearing.getSearchableFields().removeAll(namesToBeRemoved);

            if(!openHearing.getAdvocate().getIndividualIds().contains(individualId))
             openHearing.getAdvocate().getIndividualIds().add(individualId);
            producer.push(config.getOpenHearingTopic(), openHearing);
        }
    }

    private void enrichAndCallEvidenceCreate(CourtCase courtCase, JoinCaseLitigant joinCaseLitigant, RequestInfo requestInfo) {
        if (joinCaseLitigant.getDocuments() != null && !joinCaseLitigant.getDocuments().isEmpty()) {

            Document document = objectMapper.convertValue(joinCaseLitigant.getDocuments().get(0), Document.class);
            org.egov.common.contract.models.Document workflowDocument = objectMapper.convertValue(document, org.egov.common.contract.models.Document.class);

            String sourceType = joinCaseLitigant.getPartyType().contains("complainant") ? "COMPLAINANT" : "ACCUSED";
            String artifactType = joinCaseLitigant.getPartyType().contains("complainant") ? "COMPLAINANT_PIP_AFFIDAVIT" : "RESPONDENT_PIP_AFFIDAVIT";

            WorkflowObject workflowObject = new WorkflowObject();
            workflowObject.setAction("TYPE DEPOSITION");
            workflowObject.setDocuments(Collections.singletonList(workflowDocument));

            EvidenceRequest evidenceRequest = EvidenceRequest.builder().requestInfo(requestInfo)
                    .artifact(Artifact.builder()
                            .artifactType(artifactType)
                            .sourceType(sourceType)
                            .sourceID(joinCaseLitigant.getIndividualId())
                            .filingType("CASE_FILING")
                            .filingNumber(courtCase.getFilingNumber())
                            .comments(new ArrayList<>())
                            .isEvidence(false)
                            .caseId(courtCase.getId().toString())
                            .tenantId(courtCase.getTenantId())
                            .file(document)
                            .workflow(workflowObject)
                            .build()).build();

            evidenceUtil.createEvidence(evidenceRequest);
        }
    }

    private void enrichAndCallEvidenceCreate(CourtCase courtCase, RepresentingJoinCase representingJoinCase, RequestInfo requestInfo, String partyType) {
        if (representingJoinCase.getDocuments() != null && !representingJoinCase.getDocuments().isEmpty()) {

            Document document = objectMapper.convertValue(representingJoinCase.getDocuments().get(0), Document.class);
            org.egov.common.contract.models.Document workflowDocument = objectMapper.convertValue(document, org.egov.common.contract.models.Document.class);

            String sourceType = partyType.contains("complainant") ? "COMPLAINANT" : "ACCUSED";

            WorkflowObject workflowObject = new WorkflowObject();
            workflowObject.setAction("TYPE DEPOSITION");
            workflowObject.setDocuments(Collections.singletonList(workflowDocument));

            EvidenceRequest evidenceRequest = EvidenceRequest.builder().requestInfo(requestInfo)
                    .artifact(Artifact.builder()
                            .artifactType(VAKALATNAMA_DOC)
                            .sourceType(sourceType)
                            .sourceID(representingJoinCase.getIndividualId())
                            .filingType("CASE_FILING")
                            .filingNumber(courtCase.getFilingNumber())
                            .comments(new ArrayList<>())
                            .isEvidence(false)
                            .caseId(courtCase.getId().toString())
                            .tenantId(courtCase.getTenantId())
                            .file(document)
                            .workflow(workflowObject)
                            .build()).build();

            evidenceUtil.createEvidence(evidenceRequest);

        }
    }

    private Object modifyAdditionalDetails(RequestInfo requestInfo, Object additionalDetails, RepresentingJoinCase representingJoinCase, JoinCaseRepresentative joinCaseRepresentative) {
        ObjectNode additionalDetailsNode = objectMapper.convertValue(additionalDetails, ObjectNode.class);

        try {
            // Convert the additionalDetails object to an ObjectNode for easier manipulation

            // Check if advocateDetails exist
            if (additionalDetailsNode.has("advocateDetails")) {
                ObjectNode advocateDetails = (ObjectNode) additionalDetailsNode.get("advocateDetails");

                // Check if the formdata array exists within advocateDetails
                if (advocateDetails.has("formdata") && advocateDetails.get("formdata").isArray()) {
                    ArrayNode formData = (ArrayNode) advocateDetails.get("formdata");

                    // Iterate over each element in the formData array
                    for (int i = 0; i < formData.size(); i++) {
                        ObjectNode dataNode = (ObjectNode) formData.get(i).get("data");

                        // Get the boxComplainant object for matching the litigant
                        ObjectNode boxComplainant = (ObjectNode) dataNode.get("multipleAdvocatesAndPip").get("boxComplainant");

                        // Skip if the litigant doesn't match
                        if (!boxComplainant.get("individualId").textValue().equalsIgnoreCase(representingJoinCase.getIndividualId())) {
                            continue;
                        }

                        // Ensure vakalatnamaFileUpload is initialized
                        ObjectNode multipleAdvocatesAndPip = (ObjectNode) dataNode.get("multipleAdvocatesAndPip");
                        // Update isComplainantPip
                        ObjectNode isComplainantPipNode = objectMapper.createObjectNode();
                        isComplainantPipNode.put("code", "NO");
                        isComplainantPipNode.put("name", "no");
                        isComplainantPipNode.put("isEnabled", true);
                        multipleAdvocatesAndPip.set("isComplainantPip", isComplainantPipNode);

                        if (representingJoinCase.getDocuments() != null && !representingJoinCase.getDocuments().isEmpty()) {

                            ObjectNode vakalatnamaFileUpload = objectMapper.createObjectNode();

                            // Initialize the 'document' array
                            ArrayNode document = objectMapper.createArrayNode();

                            ObjectNode documentNode = objectMapper.createObjectNode();
                            documentNode.put("fileStore", representingJoinCase.getDocuments().get(0).getFileStore());
                            documentNode.put("documentType", representingJoinCase.getDocuments().get(0).getDocumentType());

                            document.add(documentNode);

                            vakalatnamaFileUpload.set("document", document);
                            multipleAdvocatesAndPip.set("vakalatnamaFileUpload", vakalatnamaFileUpload);

                            // Ensure vakalatnamaFileUpload is properly set after modification
                            multipleAdvocatesAndPip.set("vakalatnamaFileUpload", vakalatnamaFileUpload);

                        }

                        // Ensure multipleAdvocateNameDetails is initialized and clear it
                        ArrayNode multipleAdvocateNameDetails = ensureArrayNodeInitialized(multipleAdvocatesAndPip.get("multipleAdvocateNameDetails"));

                        List<Advocate> advocatesList = advocateUtil.fetchAdvocatesById(requestInfo, joinCaseRepresentative.getAdvocateId());
                        Advocate joinCaseAdvocate = advocatesList.get(0);

                        List<Individual> individualsList = individualService.getIndividualsByIndividualId(requestInfo, joinCaseAdvocate.getIndividualId());
                        Individual individual = individualsList.get(0);

                        // Create a new ObjectNode for the new advocate details
                        ObjectNode newAdvocateNode = objectMapper.createObjectNode();

                        // Create advocateNameDetails node
                        ObjectNode advocateNameDetails = objectMapper.createObjectNode();
                        advocateNameDetails.put("lastName", individual.getName().getFamilyName());
                        advocateNameDetails.put("firstName", individual.getName().getGivenName());
                        advocateNameDetails.put("middleName", individual.getName().getOtherNames());
                        advocateNameDetails.put("advocateMobileNumber", individual.getMobileNumber());

                        // Add advocateIdProof array
                        ArrayNode advocateIdProof = objectMapper.createArrayNode();
                        ObjectNode idProofNode = objectMapper.createObjectNode();

                        Identifier identifier = individual.getIdentifiers().get(0);
                        AdditionalFields additionalFields = individual.getAdditionalFields();

                        List<Field> fields = additionalFields.getFields();
                        String fileStoreId = null;
                        String filename = null;

                        for (Field field : fields) {
                            if ("identifierIdDetails".equals(field.getKey())) {
                                JsonNode jsonNode = objectMapper.readTree(field.getValue());
                                fileStoreId = jsonNode.has("fileStoreId") ? jsonNode.get("fileStoreId").asText() : null;
                                filename = jsonNode.has("filename") ? jsonNode.get("filename").asText() : null;
                                break;
                            }
                        }

                        idProofNode.put("name", identifier.getIdentifierType());
                        idProofNode.put("fileName", identifier.getIdentifierType() + " Card");
                        idProofNode.put("fileStore", fileStoreId);
                        idProofNode.put("documentName", filename);
                        advocateIdProof.add(idProofNode);

                        // Set the advocateNameDetails and advocateIdProof into the newAdvocateNode
                        newAdvocateNode.set("advocateNameDetails", advocateNameDetails);
                        newAdvocateNode.set("advocateIdProof", advocateIdProof);

                        // Add the new advocate node to the multipleAdvocateNameDetails array
                        multipleAdvocateNameDetails.add(newAdvocateNode);
                        multipleAdvocatesAndPip.set("multipleAdvocateNameDetails", multipleAdvocateNameDetails);

                        // Ensure the multipleAdvocatesAndPip object exists, if not create one
//                        ObjectNode pipNode = (ObjectNode) dataNode.get("multipleAdvocatesAndPip");
//                        dataNode.set("multipleAdvocatesAndPip", pipNode);

                        // Set updated multipleAdvocateNameDetails back to pipNode
                        // pipNode.set("multipleAdvocateNameDetails", multipleAdvocateNameDetails);

                        // No need to explicitly set pipNode again to dataNode as it's already updated within
                        break;
                    }
                }
            }
        } catch (JsonProcessingException e) {
            // Handle JSON processing exceptions (e.g., invalid JSON syntax)
        }
        return objectMapper.convertValue(additionalDetailsNode, additionalDetails.getClass());
    }

    private void replaceAdvocate(JoinCaseV2Request joinCaseRequest, CourtCase courtCase, String advocateId) {
        try {
            List<String> taskReferenceNoList = new ArrayList<>();
            IndividualDetails individualDetails = new IndividualDetails();

            if (joinCaseRequest.getJoinCaseData().getRepresentative().getIsJudgeApproving()) {
                TaskResponse taskResponse = createTaskForJudge(joinCaseRequest, courtCase);
                taskReferenceNoList.add(taskResponse.getTask().getTaskNumber());
                updateIndividualDetails(taskResponse, individualDetails);
            } else {
                Map<String, List<RepresentingJoinCase>> replaceAdvocateRepresentingMap = new LinkedHashMap<>();
                AtomicBoolean isAdvocateDetailsNamesExtracted = new AtomicBoolean(false);

                joinCaseRequest.getJoinCaseData().getRepresentative().getRepresenting().forEach(representingJoinCase -> {
                    if (representingJoinCase.getIsAlreadyPip()) {
                        // Handle already PIP case
                        TaskResponse taskResponse = null;
                        try {
                            taskResponse = createTaskPip(joinCaseRequest, representingJoinCase, advocateId, courtCase);
                            if (!isAdvocateDetailsNamesExtracted.get()) {
                                updateIndividualDetails(taskResponse, individualDetails);
                                isAdvocateDetailsNamesExtracted.set(true);
                            }
                        } catch (JsonProcessingException e) {
                            log.error("Error occurred while creating task for pip :: {}", e.toString());
                            throw new CustomException(JOIN_CASE_ERR, TASK_SERVICE_ERROR);
                        }
                        taskReferenceNoList.add(taskResponse.getTask().getTaskNumber());

                    } else {
                        representingJoinCase.getReplaceAdvocates().forEach(replaceAdvocateId -> {
                            List<RepresentingJoinCase> representingJoinCaseList;
                            if (!replaceAdvocateRepresentingMap.containsKey(replaceAdvocateId)) {
                                representingJoinCaseList = new ArrayList<>();
                            } else {
                                representingJoinCaseList = replaceAdvocateRepresentingMap.get(replaceAdvocateId);
                            }
                            representingJoinCaseList.add(representingJoinCase);
                            replaceAdvocateRepresentingMap.put(replaceAdvocateId, representingJoinCaseList);

                        });
                    }
                });

                //handle task creation for each advocate
                replaceAdvocateRepresentingMap.forEach((key, value) -> {
                    TaskResponse taskResponse = null;

                    try {
                        taskResponse = createTaskAdvocate(joinCaseRequest, key, value, courtCase);
                        if (!isAdvocateDetailsNamesExtracted.get()) {
                            updateIndividualDetails(taskResponse, individualDetails);
                            isAdvocateDetailsNamesExtracted.set(true);
                        }
                    } catch (JsonProcessingException e) {
                        log.error("Error occurred while creating task for advocate :: {}", e.toString());
                        throw new CustomException(JOIN_CASE_ERR, TASK_SERVICE_ERROR);
                    }
                    taskReferenceNoList.add(taskResponse.getTask().getTaskNumber());
                });

            }

            List<PendingAdvocateRequest> pendingAdvocateRequestList = courtCase.getPendingAdvocateRequests();
            if (pendingAdvocateRequestList == null) {
                pendingAdvocateRequestList = new ArrayList<>();
            }
            Optional<PendingAdvocateRequest> pendingAdvocateRequestOptional = pendingAdvocateRequestList.stream()
                    .filter(pendingAdvocateRequest -> pendingAdvocateRequest.getAdvocateId().equalsIgnoreCase(advocateId))
                    .findFirst();
            PendingAdvocateRequest pendingAdvocateRequest = pendingAdvocateRequestOptional.orElseGet(PendingAdvocateRequest::new);
            boolean isExisting = pendingAdvocateRequestOptional.isPresent();
            if (!isExisting) {
                pendingAdvocateRequest.setAdvocateId(advocateId);
                pendingAdvocateRequest.setIndividualDetails(individualDetails);
            }
            boolean isPartOfCase = courtCase.getRepresentatives() != null &&
                    !courtCase.getRepresentatives().stream()
                            .filter(adv -> adv.getAdvocateId() != null && adv.getAdvocateId().equalsIgnoreCase(advocateId))
                            .toList()
                            .isEmpty();
            if (isPartOfCase) {
                pendingAdvocateRequest.setStatus(PARTIALLY_PENDING);
            } else {
                pendingAdvocateRequest.setStatus(PENDING);
            }

            pendingAdvocateRequest.addTaskReferenceNoList(taskReferenceNoList);
            if (!isExisting) {
                pendingAdvocateRequestList.add(pendingAdvocateRequest);
            }

            courtCase.setPendingAdvocateRequests(pendingAdvocateRequestList);

            producer.push(config.getUpdatePendingAdvocateRequestKafkaTopic(), courtCase);
        } catch (Exception e) {
            log.error("Error occurred while creating task for join case request :: {}", e.toString());
            throw new CustomException(JOIN_CASE_ERR, TASK_SERVICE_ERROR);
        }

    }

    private void updateIndividualDetails(TaskResponse taskResponse, IndividualDetails individualDetails) {
        JoinCaseTaskRequest taskDetails = objectMapper.convertValue(taskResponse.getTask().getTaskDetails(), JoinCaseTaskRequest.class);
        IndividualDetails joinCaseIndividual = taskDetails.getAdvocateDetails().getIndividualDetails();
        individualDetails.setFirstName(joinCaseIndividual.getFirstName());
        individualDetails.setMiddleName(joinCaseIndividual.getMiddleName());
        individualDetails.setLastName(joinCaseIndividual.getLastName());
    }

    private TaskResponse createTaskForJudge(JoinCaseV2Request joinCaseRequest, CourtCase courtCase) throws JsonProcessingException {
        TaskRequest taskRequest = new TaskRequest();
        Task task = new Task();
        task.setTaskType(JOIN_CASE);
        task.setStatus("");
        task.setTenantId(joinCaseRequest.getRequestInfo().getUserInfo().getTenantId());
        task.setFilingNumber(joinCaseRequest.getJoinCaseData().getFilingNumber());
        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction("CREATE");
        task.setWorkflow(workflow);
        ObjectMapper objectMapper = new ObjectMapper();

        JoinCaseDataV2 joinCaseData = joinCaseRequest.getJoinCaseData();

        JoinCaseTaskRequest taskJoinCase = new JoinCaseTaskRequest();

        List<Advocate> advocatesList = advocateUtil.fetchAdvocatesById(joinCaseRequest.getRequestInfo(), joinCaseData.getRepresentative().getAdvocateId());
        Advocate joinCaseAdvocate = advocatesList.get(0);

        List<Individual> individualsList = individualService.getIndividualsByIndividualId(joinCaseRequest.getRequestInfo(), joinCaseAdvocate.getIndividualId());
        Individual individual = individualsList.get(0);

        IndividualDetails individualDetails = enrichIndividualDetailsInJoinCaseTaskRequest(individual);
        AdvocateDetails advocateDetails = enrichAdvocateDetailsInJoinCaseTaskRequest(individualDetails, joinCaseAdvocate, individual, joinCaseData);

        taskJoinCase.setAdvocateDetails(advocateDetails);

        List<ReplacementDetails> replacementDetailsList = new ArrayList<>();

        joinCaseData.getRepresentative().getRepresenting().forEach(representingJoinCase -> {

            LitigantDetails litigantDetails = new LitigantDetails();
            Party litigant = courtCase.getLitigants().stream().filter(lit -> lit.getIndividualId().equalsIgnoreCase(representingJoinCase.getIndividualId())).findFirst().get();
            litigantDetails.setIndividualId(representingJoinCase.getIndividualId());
            litigantDetails.setPartyType(litigant.getPartyType());

            List<Individual> individualsListForLitigant = individualService.getIndividualsByIndividualId(joinCaseRequest.getRequestInfo(), litigant.getIndividualId());
            Individual individualForLitigant = individualsListForLitigant.get(0);

            if (individualForLitigant != null) {
                litigantDetails.setUserUuid(individualForLitigant.getUserUuid());
            }

            String fullName;
            if (representingJoinCase.getUniqueId() != null) {
                //respondent name enrich
                fullName = getRespondentNameByUniqueId(courtCase.getAdditionalDetails(), representingJoinCase.getUniqueId(), individualForLitigant);
            } else {
                //complainant name enrich
                fullName = getComplainantNameByIndividualId(courtCase.getAdditionalDetails(), litigant.getIndividualId());
            }
            litigantDetails.setName(fullName);

            if (!representingJoinCase.getIsAlreadyPip()) {
                representingJoinCase.getReplaceAdvocates().forEach(advocateId -> {
                    ReplacementDetails replacementDetails = new ReplacementDetails();

                    ReplacementAdvocateDetails replacementAdvocateDetails = new ReplacementAdvocateDetails();
                    replacementAdvocateDetails.setAdvocateUuid(advocateId);

                    List<Advocate> replacedvocatesList = advocateUtil.fetchAdvocatesById(joinCaseRequest.getRequestInfo(), advocateId);
                    Advocate replaceAdvocate = replacedvocatesList.get(0);

                    List<Individual> individualList = individualService.getIndividualsByIndividualId(joinCaseRequest.getRequestInfo(), replaceAdvocate.getIndividualId());
                    Individual individualAdvocate = individualList.get(0);

                    String name = getName(individualAdvocate);
                    replacementAdvocateDetails.setBarRegistrationNumber(replaceAdvocate.getBarRegistrationNumber());
                    replacementAdvocateDetails.setMobileNumber(individualAdvocate.getMobileNumber());
                    replacementAdvocateDetails.setName(name);
                    replacementAdvocateDetails.setUserUuid(individualAdvocate.getUserUuid());

                    replacementDetails.setAdvocateDetails(replacementAdvocateDetails);

                    replacementDetails.setIsLitigantPip(representingJoinCase.getIsAlreadyPip());

                    replacementDetails.setLitigantDetails(litigantDetails);

                    if (representingJoinCase.getDocuments() != null && !representingJoinCase.getDocuments().isEmpty()) {
                        ReplacementDocumentDetails document = new ReplacementDocumentDetails();
                        document.setFileStore(representingJoinCase.getDocuments().get(0).getFileStore());
                        document.setDocumentType(representingJoinCase.getDocuments().get(0).getDocumentType());
                        document.setAdditionalDetails(representingJoinCase.getDocuments().get(0).getAdditionalDetails());
                        replacementDetails.setDocument(document);
                    }
                    replacementDetailsList.add(replacementDetails);
                });
            } else {
                ReplacementDetails replacementDetails = new ReplacementDetails();

                replacementDetails.setIsLitigantPip(representingJoinCase.getIsAlreadyPip());
                replacementDetails.setLitigantDetails(litigantDetails);

                if (representingJoinCase.getDocuments() != null && !representingJoinCase.getDocuments().isEmpty()) {
                    ReplacementDocumentDetails document = new ReplacementDocumentDetails();
                    document.setFileStore(representingJoinCase.getDocuments().get(0).getFileStore());
                    document.setDocumentType(representingJoinCase.getDocuments().get(0).getDocumentType());
                    document.setAdditionalDetails(representingJoinCase.getDocuments().get(0).getAdditionalDetails());
                    replacementDetails.setDocument(document);
                }
                replacementDetailsList.add(replacementDetails);
            }

        });

        taskJoinCase.setReplacementDetails(replacementDetailsList);
        taskJoinCase.setAdvocateDetails(advocateDetails);
        taskJoinCase.setReason(joinCaseData.getRepresentative().getReason());
        taskJoinCase.setReasonDocument(joinCaseRequest.getJoinCaseData().getRepresentative().getReasonDocument());

        Object taskDetails = objectMapper.convertValue(taskJoinCase, Object.class);
        task.setTaskDetails(taskDetails);

        taskRequest.setTask(task);
        RequestInfo requestInfo = joinCaseRequest.getRequestInfo();
        Role role = Role.builder().code("TASK_CREATOR").name("TASK_CREATOR").tenantId(joinCaseAdvocate.getTenantId()).build();
        requestInfo.getUserInfo().getRoles().add(role);
        taskRequest.setRequestInfo(requestInfo);
        return taskUtil.callCreateTask(taskRequest);
    }

    private TaskResponse createTaskPip(JoinCaseV2Request joinCaseRequest, RepresentingJoinCase representingJoinCase, String advocateId, CourtCase courtCase) throws JsonProcessingException {
        String userUUID = individualService.getIndividualsByIndividualId(joinCaseRequest.getRequestInfo(), representingJoinCase.getIndividualId()).get(0).getUserUuid();
        TaskRequest taskRequest = new TaskRequest();
        Task task = new Task();
        task.setTaskType(JOIN_CASE);
        task.setStatus("");
        task.setTenantId(joinCaseRequest.getRequestInfo().getUserInfo().getTenantId());
        task.setFilingNumber(joinCaseRequest.getJoinCaseData().getFilingNumber());
        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction("CREATE");
        workflow.setAdditionalDetails(getAdditionalDetailsForExcludingRoles());
        workflow.setAssignes(List.of(userUUID));
        task.setWorkflow(workflow);
        ObjectMapper objectMapper = new ObjectMapper();

        JoinCaseDataV2 joinCaseData = joinCaseRequest.getJoinCaseData();

        JoinCaseTaskRequest taskJoinCase = new JoinCaseTaskRequest();

        //Set advocate details
        List<Advocate> advocatesList = advocateUtil.fetchAdvocatesById(joinCaseRequest.getRequestInfo(), advocateId);
        Advocate joinCaseAdvocate = advocatesList.get(0);

        List<Individual> individualsList = individualService.getIndividualsByIndividualId(joinCaseRequest.getRequestInfo(), joinCaseAdvocate.getIndividualId());
        Individual individual = individualsList.get(0);

        IndividualDetails individualDetails = enrichIndividualDetailsInJoinCaseTaskRequest(individual);
        AdvocateDetails advocateDetails = enrichAdvocateDetailsInJoinCaseTaskRequest(individualDetails, joinCaseAdvocate, individual, joinCaseData);
        taskJoinCase.setAdvocateDetails(advocateDetails);

        List<ReplacementDetails> replacementDetailsList = new ArrayList<>();
        ReplacementDetails replacementDetails = new ReplacementDetails();

        LitigantDetails litigantDetails = new LitigantDetails();
        Party litigant = courtCase.getLitigants().stream().filter(lit -> lit.getIndividualId().equalsIgnoreCase(representingJoinCase.getIndividualId())).findFirst().get();
        litigantDetails.setIndividualId(representingJoinCase.getIndividualId());
        litigantDetails.setPartyType(litigant.getPartyType());

        List<Individual> individualsListForLitigant = individualService.getIndividualsByIndividualId(joinCaseRequest.getRequestInfo(), litigant.getIndividualId());
        Individual individualForLitigant = individualsListForLitigant.get(0);

        if (individualForLitigant != null) {
            litigantDetails.setUserUuid(individualForLitigant.getUserUuid());
        }

        String fullName;
        if (representingJoinCase.getUniqueId() != null) {
            //respondent name enrich
            fullName = getRespondentNameByUniqueId(courtCase.getAdditionalDetails(), representingJoinCase.getUniqueId(), individualForLitigant);
        } else {
            //complainant name enrich
            fullName = getComplainantNameByIndividualId(courtCase.getAdditionalDetails(), litigant.getIndividualId());
        }
        litigantDetails.setName(fullName);

        replacementDetails.setIsLitigantPip(representingJoinCase.getIsAlreadyPip());
        replacementDetails.setLitigantDetails(litigantDetails);

        if (representingJoinCase.getDocuments() != null && !representingJoinCase.getDocuments().isEmpty()) {
            ReplacementDocumentDetails document = new ReplacementDocumentDetails();
            document.setFileStore(representingJoinCase.getDocuments().get(0).getFileStore());
            document.setDocumentType(representingJoinCase.getDocuments().get(0).getDocumentType());
            document.setAdditionalDetails(representingJoinCase.getDocuments().get(0).getAdditionalDetails());
            replacementDetails.setDocument(document);
        }
        replacementDetailsList.add(replacementDetails);

        taskJoinCase.setReplacementDetails(replacementDetailsList);
        taskJoinCase.setAdvocateDetails(advocateDetails);
        taskJoinCase.setReason(joinCaseData.getRepresentative().getReason());
        taskJoinCase.setReasonDocument(joinCaseRequest.getJoinCaseData().getRepresentative().getReasonDocument());

        Object taskDetails = objectMapper.convertValue(taskJoinCase, Object.class);
        task.setTaskDetails(taskDetails);

        taskRequest.setTask(task);
        RequestInfo requestInfo = joinCaseRequest.getRequestInfo();
        Role role = Role.builder().code("TASK_CREATOR").name("TASK_CREATOR").tenantId(joinCaseAdvocate.getTenantId()).build();
        requestInfo.getUserInfo().getRoles().add(role);
        taskRequest.setRequestInfo(requestInfo);
        return taskUtil.callCreateTask(taskRequest);
    }

    private Object getAdditionalDetailsForExcludingRoles() throws JsonProcessingException {
        return objectMapper.readValue("{\"excludeRoles\":[\"TASK_EDITOR\"]}", Object.class);
    }

    private TaskResponse createTaskAdvocate(JoinCaseV2Request joinCaseRequest, String replaceAdvocateId, List<RepresentingJoinCase> representingJoinCaseList, CourtCase courtCase) throws JsonProcessingException {
        String individualIdForAdvocate = advocateUtil.getAdvocate(joinCaseRequest.getRequestInfo(), List.of(replaceAdvocateId)).stream().findFirst().orElse(null);
        String userUUID = individualService.getIndividualsByIndividualId(joinCaseRequest.getRequestInfo(), individualIdForAdvocate).get(0).getUserUuid();

        TaskRequest taskRequest = new TaskRequest();
        Task task = new Task();
        task.setTaskType(JOIN_CASE);
        task.setStatus("");
        task.setTenantId(joinCaseRequest.getRequestInfo().getUserInfo().getTenantId());
        task.setFilingNumber(joinCaseRequest.getJoinCaseData().getFilingNumber());
        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction("CREATE");
        workflow.setAdditionalDetails(getAdditionalDetailsForExcludingRoles());
        workflow.setAssignes(List.of(userUUID));
        task.setWorkflow(workflow);
        ObjectMapper objectMapper = new ObjectMapper();

        JoinCaseDataV2 joinCaseData = joinCaseRequest.getJoinCaseData();

        JoinCaseTaskRequest taskJoinCase = new JoinCaseTaskRequest();

        List<Advocate> advocatesList = advocateUtil.fetchAdvocatesById(joinCaseRequest.getRequestInfo(), joinCaseData.getRepresentative().getAdvocateId());
        Advocate joinCaseAdvocate = advocatesList.get(0);

        List<Individual> individualsList = individualService.getIndividualsByIndividualId(joinCaseRequest.getRequestInfo(), joinCaseAdvocate.getIndividualId());
        Individual individual = individualsList.get(0);

        IndividualDetails individualDetails = enrichIndividualDetailsInJoinCaseTaskRequest(individual);
        AdvocateDetails advocateDetails = enrichAdvocateDetailsInJoinCaseTaskRequest(individualDetails, joinCaseAdvocate, individual, joinCaseData);

        taskJoinCase.setAdvocateDetails(advocateDetails);

        List<ReplacementDetails> replacementDetailsList = new ArrayList<>();

        representingJoinCaseList.forEach(representingJoinCase -> {

            ReplacementDetails replacementDetails = new ReplacementDetails();

            LitigantDetails litigantDetails = new LitigantDetails();
            Party litigant = courtCase.getLitigants().stream().filter(lit -> lit.getIndividualId().equalsIgnoreCase(representingJoinCase.getIndividualId())).findFirst().get();
            litigantDetails.setIndividualId(representingJoinCase.getIndividualId());
            litigantDetails.setPartyType(litigant.getPartyType());

            List<Individual> individualsListForLitigant = individualService.getIndividualsByIndividualId(joinCaseRequest.getRequestInfo(), litigant.getIndividualId());
            Individual individualForLitigant = individualsListForLitigant.get(0);

            if (individualForLitigant != null) {
                litigantDetails.setUserUuid(individualForLitigant.getUserUuid());
            }

            String fullName;
            if (representingJoinCase.getUniqueId() != null) {
                //respondent name enrich
                fullName = getRespondentNameByUniqueId(courtCase.getAdditionalDetails(), representingJoinCase.getUniqueId(), individualForLitigant);
            } else {
                //complainant name enrich
                fullName = getComplainantNameByIndividualId(courtCase.getAdditionalDetails(), litigant.getIndividualId());
            }
            litigantDetails.setName(fullName);

            ReplacementAdvocateDetails replacementAdvocateDetails = new ReplacementAdvocateDetails();
            replacementAdvocateDetails.setAdvocateUuid(replaceAdvocateId);

            List<Advocate> replacedvocatesList = advocateUtil.fetchAdvocatesById(joinCaseRequest.getRequestInfo(), replaceAdvocateId);
            Advocate replaceAdvocate = replacedvocatesList.get(0);

            List<Individual> individualList = individualService.getIndividualsByIndividualId(joinCaseRequest.getRequestInfo(), replaceAdvocate.getIndividualId());
            Individual individualAdvocate = individualList.get(0);

            String name = getName(individualAdvocate);
            replacementAdvocateDetails.setBarRegistrationNumber(replaceAdvocate.getBarRegistrationNumber());
            replacementAdvocateDetails.setMobileNumber(individualAdvocate.getMobileNumber());
            replacementAdvocateDetails.setName(name);
            replacementAdvocateDetails.setUserUuid(individualAdvocate.getUserUuid());

            replacementDetails.setAdvocateDetails(replacementAdvocateDetails);

            replacementDetails.setIsLitigantPip(representingJoinCase.getIsAlreadyPip());

            replacementDetails.setLitigantDetails(litigantDetails);

            if (representingJoinCase.getDocuments() != null && !representingJoinCase.getDocuments().isEmpty()) {
                ReplacementDocumentDetails document = new ReplacementDocumentDetails();
                document.setFileStore(representingJoinCase.getDocuments().get(0).getFileStore());
                document.setDocumentType(representingJoinCase.getDocuments().get(0).getDocumentType());
                document.setAdditionalDetails(representingJoinCase.getDocuments().get(0).getAdditionalDetails());
                replacementDetails.setDocument(document);
            }
            replacementDetailsList.add(replacementDetails);
        });

        taskJoinCase.setReplacementDetails(replacementDetailsList);
        taskJoinCase.setAdvocateDetails(advocateDetails);
        taskJoinCase.setReason(joinCaseData.getRepresentative().getReason());
        taskJoinCase.setReasonDocument(joinCaseRequest.getJoinCaseData().getRepresentative().getReasonDocument());

        Object taskDetails = objectMapper.convertValue(taskJoinCase, Object.class);
        task.setTaskDetails(taskDetails);

        taskRequest.setTask(task);
        RequestInfo requestInfo = joinCaseRequest.getRequestInfo();
        Role role = Role.builder().code("TASK_CREATOR").name("TASK_CREATOR").tenantId(joinCaseAdvocate.getTenantId()).build();
        requestInfo.getUserInfo().getRoles().add(role);
        taskRequest.setRequestInfo(requestInfo);
        return taskUtil.callCreateTask(taskRequest);
    }

    private void enrichAndPushLitigantJoinCase(JoinCaseV2Request joinCaseRequest, CourtCase caseObj, CourtCase courtCase, AuditDetails auditDetails) {

        caseObj.setAuditdetails(auditDetails);
        JoinCaseDataV2 joinCaseData = joinCaseRequest.getJoinCaseData();
        mapAndSetLitigants(joinCaseData, caseObj, courtCase, joinCaseRequest.getRequestInfo());

        log.info("enriching litigants");
        enrichLitigantsOnCreateAndUpdate(caseObj, auditDetails);

        log.info("Pushing join case litigant details :: {}", caseObj);
        producer.push(config.getLitigantJoinCaseTopic(), caseObj);
    }

    private TaskResponse createTaskForJudgePOA(JoinCaseV2Request joinCaseRequest, Individual poaIndividual) throws JsonProcessingException {
        TaskRequest taskRequest = new TaskRequest();
        Task task = new Task();
        task.setTaskType(JOIN_CASE);
        task.setStatus("");
        task.setTaskDescription("poaJoinCase");
        task.setTenantId(joinCaseRequest.getRequestInfo().getUserInfo().getTenantId());
        task.setFilingNumber(joinCaseRequest.getJoinCaseData().getFilingNumber());
        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction("CREATE");

        ObjectNode detailsNode = objectMapper.createObjectNode();
        ArrayNode excludeRolesArray = detailsNode.putArray("excludeRoles");
        excludeRolesArray.add("TASK_EDITOR");
        excludeRolesArray.add("SYSTEM");
        workflow.setAdditionalDetails(detailsNode);

        task.setWorkflow(workflow);

        ObjectMapper objectMapper = new ObjectMapper();

        JoinCaseDataV2 joinCaseData = joinCaseRequest.getJoinCaseData();

        POAJoinCaseTaskRequest taskJoinCase = new POAJoinCaseTaskRequest();

        List<POAIndividualDetails> poaIndividualDetailsList = new ArrayList<>();

        POADetails poaDetails = new POADetails();
        poaDetails.setFirstName(poaIndividual.getName().getGivenName());
        poaDetails.setMiddleName(poaIndividual.getName().getOtherNames());
        poaDetails.setLastName(poaIndividual.getName().getFamilyName());
        poaDetails.setIdDocument(getPoaIdProofDocument(poaIndividual, objectMapper));
        poaDetails.setIndividualId(poaIndividual.getIndividualId());
        poaDetails.setMobileNumber(poaIndividual.getMobileNumber());
        poaDetails.setUserUuid(poaIndividual.getUserUuid());
        poaDetails.setAddress(getPoaAdressDetails(poaIndividual));

        joinCaseData.getPoa().getPoaRepresenting().forEach(representingJoinCase -> {

            POAIndividualDetails poaIndividualDetails = new POAIndividualDetails();
            poaIndividualDetails.setIndividualId(representingJoinCase.getIndividualId());
            poaIndividualDetails.setIsRevoking(representingJoinCase.getIsRevoking());
            poaIndividualDetails.setExistingPoaIndividualId(representingJoinCase.getExistingPoaIndividualId());
            poaIndividualDetails.setUniqueId(representingJoinCase.getUniqueId());
            poaIndividualDetails.setPoaAuthDocument(representingJoinCase.getPoaAuthDocument());

            poaIndividualDetailsList.add(poaIndividualDetails);
        });

        taskJoinCase.setPoaDetails(poaDetails);
        taskJoinCase.setIndividualDetails(poaIndividualDetailsList);

        Object taskDetails = objectMapper.convertValue(taskJoinCase, Object.class);
        task.setTaskDetails(taskDetails);

        taskRequest.setTask(task);
        RequestInfo requestInfo = joinCaseRequest.getRequestInfo();
        Role role = Role.builder().code("TASK_CREATOR").name("TASK_CREATOR").tenantId(joinCaseData.getTenantId()).build();
        requestInfo.getUserInfo().getRoles().add(role);
        taskRequest.setRequestInfo(requestInfo);
        return taskUtil.callCreateTask(taskRequest);
    }

    private static Document getPoaIdProofDocument(Individual poaIndividual, ObjectMapper objectMapper) throws JsonProcessingException {
        Identifier identifier = poaIndividual.getIdentifiers().get(0);
        AdditionalFields additionalFields = poaIndividual.getAdditionalFields();

        List<Field> fields = additionalFields.getFields();
        String fileStoreId = null;
        String filename = null;

        for (Field field : fields) {
            if ("identifierIdDetails".equals(field.getKey())) {
                JsonNode jsonNode = objectMapper.readTree(field.getValue());
                fileStoreId = jsonNode.has("fileStoreId") ? jsonNode.get("fileStoreId").asText() : null;
                filename = jsonNode.has("filename") ? jsonNode.get("filename").asText() : null;
                break;
            }
        }

        Map<String, Object> additionalDetails = new HashMap<>();
        additionalDetails.put("fileName", identifier.getIdentifierType() + " Card");
        additionalDetails.put("documentName", filename);

        String uuid = UUID.randomUUID().toString();

        return Document.builder()
                .id(uuid)
                .fileStore(fileStoreId)
                .documentUid(uuid)
                .documentType("POA_COMPLAINANT_ID_PROOF")
                .additionalDetails(additionalDetails)
                .build();
    }

    private Map<String, Object> getPoaAdressDetails(Individual poaIndividual) {
        Address address = poaIndividual.getAddress().get(0);

        Map<String, Object> poaAddressDetails = new HashMap<>();
        poaAddressDetails.put("city", address.getCity());
        poaAddressDetails.put("state", address.getAddressLine1());
        poaAddressDetails.put("district", address.getAddressLine2());
        poaAddressDetails.put("pincode", address.getPincode());
        poaAddressDetails.put("locality", address.getStreet());

        Map<String, Object> coordinates = new HashMap<>();
        coordinates.put("latitude", address.getLatitude());
        coordinates.put("longitude", address.getLongitude());
        poaAddressDetails.put("coordinates", coordinates);

        Map<String, Object> typeOfAddress = new HashMap<>();
        typeOfAddress.put("id", 1);
        typeOfAddress.put("code", "RESIDENTIAL");
        typeOfAddress.put("name", "Residential");
        typeOfAddress.put("isActive", true);

        poaAddressDetails.put("typeOfAddress", typeOfAddress);
        return poaAddressDetails;
    }


    private Object updateRespondentDetails(Object additionalDetails, RequestInfo requestInfo, JoinCaseLitigant joinCaseLitigant) {

        ObjectNode additionalDetailsNode = objectMapper.convertValue(additionalDetails, ObjectNode.class);

        if (additionalDetailsNode.has("respondentDetails")) {
            ObjectNode respondentDetails = (ObjectNode) additionalDetailsNode.get("respondentDetails");

            if (respondentDetails.has("formdata") && respondentDetails.get("formdata").isArray()) {
                ArrayNode formData = (ArrayNode) respondentDetails.get("formdata");

                for (int i = 0; i < formData.size(); i++) {
                    ObjectNode dataNode = (ObjectNode) formData.get(i).path("data");

                    log.info("dataNode :: {}", dataNode);
                    String uniqueIdRespondent = formData.get(i).get("uniqueId").asText();

                    if (!dataNode.has("respondentVerification") && uniqueIdRespondent.equalsIgnoreCase(joinCaseLitigant.getUniqueId())) {
                        // Create the respondentVerification object
                        ObjectNode respondentVerificationNode = objectMapper.createObjectNode();
                        ObjectNode individualDetailsNode = objectMapper.createObjectNode();
                        individualDetailsNode.put("individualId", joinCaseLitigant.getIndividualId());
                        respondentVerificationNode.set("individualDetails", individualDetailsNode);

// TO DO -- When accused joins the case, adding address, and mobile number in respondent details along wih old details, To be implemented later after discussion

//                        List<Individual> individualsList = individualService.getIndividualsByIndividualId(requestInfo, joinCaseLitigant.getIndividualId());
//                        Individual individual = individualsList.get(0);
//
//                        if (dataNode.has("addressDetails") && dataNode.get("addressDetails").isArray()) {
//                            ArrayNode addressDetailsArray = (ArrayNode) dataNode.get("addressDetails");
//
//                            ObjectNode newAddressDetails = objectMapper.createObjectNode();
//
//                            if(individual.getAddress()!=null && !individual.getAddress().isEmpty()) {
//                                ObjectNode addressDetailsObj = objectMapper.createObjectNode();
//                                Address address = individual.getAddress().get(0);
//                                addressDetailsObj.put("pincode",address.getPincode());
//                                addressDetailsObj.put("state",address.getAddressLine1());
//                                addressDetailsObj.put("district",address.getAddressLine2());
//                                addressDetailsObj.put("city", address.getCity());
//                                 if (address.getLocality() != null && address.getLocality().getName() != null) {
//                                     addressDetailsObj.put("locality", address.getLocality().getName());
//                                 }
//                                newAddressDetails.set("addressDetails", addressDetailsObj);
//                                newAddressDetails.put("id", UUID.randomUUID().toString());
//
//                                addressDetailsArray.add(newAddressDetails);
//                            }
//                        }
//                        if(individual.getMobileNumber()!=null && !individual.getMobileNumber().isEmpty()) {
//                            updateMobilenumber(dataNode,individual);
//                        }
                        // Insert respondentVerification into the dataNode
                        dataNode.set("respondentVerification", respondentVerificationNode);
                    }
                }
            }
        }
        return objectMapper.convertValue(additionalDetailsNode, additionalDetails.getClass());
    }

    private void updateMobilenumber(ObjectNode dataNode, Individual individual) {
        if (dataNode.has("phonenumbers")) {
            ObjectNode phonenumbersNode = (ObjectNode) dataNode.get("phonenumbers");

            if (phonenumbersNode.has("mobileNumber") && phonenumbersNode.get("mobileNumber").isArray()) {
                ArrayNode mobileNumberArray = (ArrayNode) phonenumbersNode.get("mobileNumber");

                boolean numberExists = false;
                for (JsonNode numberNode : mobileNumberArray) {
                    if (numberNode.asText().equals(individual.getMobileNumber())) {
                        numberExists = true;
                        break;
                    }
                }

                if (!numberExists) {
                    mobileNumberArray.add(individual.getMobileNumber());
                    log.info("Mobile number added to mobileNumber array.");
                } else {
                    log.info("Mobile number already exists.");
                }

            } else {
                // Create mobileNumber array and add the number
                ArrayNode mobileNumberArray = objectMapper.createArrayNode();
                mobileNumberArray.add(individual.getMobileNumber());
                phonenumbersNode.set("mobileNumber", mobileNumberArray);
                log.info("mobileNumber array created and mobile number added.");
            }

        } else {
            // Create phonenumbers object and add mobileNumber array
            ObjectNode phonenumbersNode = objectMapper.createObjectNode();
            ArrayNode mobileNumberArray = objectMapper.createArrayNode();
            mobileNumberArray.add(individual.getMobileNumber());

            phonenumbersNode.set("mobileNumber", mobileNumberArray);
            dataNode.set("phonenumbers", phonenumbersNode);
            log.info("phonenumbers object created with mobile number.");
        }

    }

    public void mapAndSetLitigants(JoinCaseDataV2 joinCaseData, CourtCase caseObj, CourtCase courtCase, RequestInfo requestInfo) {

        HearingCriteria hearingCriteria = HearingCriteria.builder()
                .filingNumber(courtCase.getFilingNumber())
                .build();
        List<Hearing> hearingList = getHearingsForCase(hearingCriteria);
        List<Hearing> scheduledHearings = hearingList.stream().filter(hearing -> hearing.getStatus().equalsIgnoreCase("SCHEDULED")).toList();
        log.info("hearing list :: {}", scheduledHearings);

        List<Attendee> newAttendees = new ArrayList<>();

        List<Party> litigants = joinCaseData.getLitigant().stream()
                .filter(litigant -> courtCase.getLitigants() == null || courtCase.getLitigants().stream()
                        .noneMatch(existingLitigant -> existingLitigant.getIndividualId().equalsIgnoreCase(litigant.getIndividualId())))
                .map(litigant -> {
                    Party party = new Party();
                    party.setTenantId(litigant.getTenantId());
                    party.setCaseId(litigant.getCaseId());
                    party.setPartyCategory(litigant.getPartyCategory());
                    party.setOrganisationID(litigant.getOrganisationID());
                    party.setIndividualId(litigant.getIndividualId());
                    party.setPartyType(litigant.getPartyType());
                    party.setIsActive(litigant.getIsActive());
                    party.setIsResponseRequired(litigant.getIsResponseRequired());
                    party.setDocuments(litigant.getDocuments());
                    party.setAuditDetails(litigant.getAuditDetails());

                    List<Individual> individualsList = individualService.getIndividualsByIndividualId(requestInfo, litigant.getIndividualId());
                    Individual individual = individualsList.get(0);

                    ObjectNode additionalDetails = objectMapper.createObjectNode();

                    additionalDetails.put("uuid", individual.getUserUuid());
                    String fullName;
                    String type;

                    if (litigant.getUniqueId() != null) {
                        //respondent name enrich
                        fullName = getRespondentNameByUniqueId(courtCase.getAdditionalDetails(), litigant.getUniqueId(), individual);
                        additionalDetails.put("fullName", fullName);
                        type = "respondent";
                    } else {
                        //complainant name enrich
                        fullName = getComplainantNameByIndividualId(courtCase.getAdditionalDetails(), litigant.getIndividualId());
                        additionalDetails.put("fullName", fullName);
                        type = "complainant";
                    }

                    Object additionalDetailsObject = objectMapper.convertValue(additionalDetails, additionalDetails.getClass());
                    party.setAdditionalDetails(additionalDetailsObject);

                    party.setHasSigned(litigant.getHasSigned());

                    Attendee newAttendee = new Attendee();
                    newAttendee.setIndividualId(litigant.getIndividualId());
                    newAttendee.setName(fullName);
                    newAttendee.setType(type);
                    newAttendees.add(newAttendee);

                    if (courtCase.getLitigants() == null) {
                        courtCase.setLitigants(new ArrayList<>());
                    }
                    courtCase.getLitigants().add(party);

                    return party;
                })
                .collect(Collectors.toList());

        scheduledHearings.forEach(hearing -> {
            Optional.ofNullable(hearing.getAttendees()).orElse(new ArrayList<>()).addAll(newAttendees);
            HearingRequest hearingRequest = new HearingRequest();
            requestInfo.getUserInfo().getRoles().add(Role.builder().code("HEARING_SCHEDULER").name("HEARING_SCHEDULER").tenantId(joinCaseData.getTenantId()).build());
            hearingRequest.setRequestInfo(requestInfo);
            hearingRequest.setHearing(hearing);
            log.info("updating hearing :: {}", hearing);
            hearingUtil.updateTranscriptAdditionalAttendees(hearingRequest);
        });

        caseObj.setLitigants(litigants);
    }

    public List<Hearing> getHearingsForCase(HearingCriteria hearingCriteria) {
        List<Hearing> hearings = new ArrayList<>();
        try {
            RequestInfo requestInfo = new RequestInfo();
            HearingSearchRequest hearingSearchRequest = HearingSearchRequest.builder()
                    .requestInfo(requestInfo)
                    .criteria(hearingCriteria)
                    .build();
            hearings = hearingUtil.fetchHearingDetails(hearingSearchRequest);
        } catch (Exception e) {
            log.error("Error occurred while fetching hearings for court: {}", e.getMessage());
        }
        return hearings;
    }

    private String getRespondentNameByUniqueId(Object additionalDetails, String uniqueId, Individual individual) {

        ObjectNode additionalDetailsNode = objectMapper.convertValue(additionalDetails, ObjectNode.class);
        String firstName = "";
        String middleName = "";
        String lastName = "";

        if (additionalDetailsNode.has("respondentDetails")) {
            ObjectNode respondentDetails = (ObjectNode) additionalDetailsNode.get("respondentDetails");

            if (respondentDetails.has("formdata") && respondentDetails.get("formdata").isArray()) {
                ArrayNode formData = (ArrayNode) respondentDetails.get("formdata");

                for (int i = 0; i < formData.size(); i++) {
                    ObjectNode dataNode = (ObjectNode) formData.get(i).path("data");

                    String uniqueIdRespondent = formData.get(i).get("uniqueId").asText();

                    if (uniqueIdRespondent.equalsIgnoreCase(uniqueId)) {
                        if (dataNode.has("respondentVerification")) {
                            // Found the matching respondent, now extract the name details
                            if (dataNode.has("respondentFirstName"))
                                firstName = dataNode.get("respondentFirstName").asText();

                            if (dataNode.has("respondentMiddleName"))
                                middleName = dataNode.get("respondentMiddleName").asText();

                            if (dataNode.has("respondentLastName"))
                                lastName = dataNode.get("respondentLastName").asText();

                            // Concatenate with a space between names, ensuring no leading or trailing spaces
                            String fullName = (firstName.isEmpty() ? "" : firstName) +
                                    (middleName.isEmpty() ? "" : " " + middleName) +
                                    (lastName.isEmpty() ? "" : " " + lastName);
                            return fullName.trim();

                        } else {
                            firstName = individual.getName().getGivenName() == null ? "" : individual.getName().getGivenName();
                            middleName = individual.getName().getOtherNames() == null ? "" : individual.getName().getOtherNames();
                            lastName = individual.getName().getFamilyName() == null ? "" : individual.getName().getFamilyName();
                            dataNode.put("respondentFirstName", firstName);
                            dataNode.put("respondentMiddleName", middleName);
                            dataNode.put("respondentLastName", lastName);
                        }
                    }
                }
            }
        }
        // Concatenate with a space between names, ensuring no leading or trailing spaces
        String fullName = (firstName.isEmpty() ? "" : firstName) +
                (middleName.isEmpty() ? "" : " " + middleName) +
                (lastName.isEmpty() ? "" : " " + lastName);
        return fullName.trim();
    }

    private String getComplainantNameByIndividualId(Object additionalDetails, String individualId) {

        ObjectNode additionalDetailsNode = objectMapper.convertValue(additionalDetails, ObjectNode.class);

        // Check if advocateDetails exist
        if (additionalDetailsNode.has("advocateDetails")) {
            ObjectNode advocateDetails = (ObjectNode) additionalDetailsNode.get("advocateDetails");

            // Check if the formdata array exists within advocateDetails
            if (advocateDetails.has("formdata") && advocateDetails.get("formdata").isArray()) {
                ArrayNode formData = (ArrayNode) advocateDetails.get("formdata");

                // Iterate over each element in the formData array
                for (int i = 0; i < formData.size(); i++) {
                    ObjectNode dataNode = (ObjectNode) formData.get(i).get("data");

                    // Get the boxComplainant object for matching the litigant
                    ObjectNode boxComplainant = (ObjectNode) dataNode.get("multipleAdvocatesAndPip").get("boxComplainant");

                    // Skip if the litigant doesn't match

                    if (boxComplainant.get("individualId").textValue().equalsIgnoreCase(individualId)) {
                        // Extract firstName, middleName, and lastName
                        String firstName = boxComplainant.path("firstName").asText();
                        String middleName = boxComplainant.path("middleName").asText();
                        String lastName = boxComplainant.path("lastName").asText();

                        // Concatenate the names with a space, ensuring no extra spaces if any part is empty
                        String fullName = firstName +
                                (middleName.isEmpty() ? "" : " " + middleName) +
                                (lastName.isEmpty() ? "" : " " + lastName);

                        return fullName.trim();
                    }
                }
            }
        }
        return "";
    }

    private TaskResponse createTask(JoinCaseV2Request joinCaseRequest, String assignes, CourtCase courtCase) {
        try {
            TaskRequest taskRequest = new TaskRequest();
            Task task = new Task();
            task.setTaskType(JOIN_CASE);
            task.setStatus("");
            task.setTenantId(joinCaseRequest.getRequestInfo().getUserInfo().getTenantId());
            task.setFilingNumber(joinCaseRequest.getJoinCaseData().getFilingNumber());
            WorkflowObject workflow = new WorkflowObject();
            workflow.setAction("CREATE");
            if (assignes != null) {
                workflow.setAdditionalDetails(getAdditionalDetailsForExcludingRoles());
                workflow.setAssignes(List.of(assignes));
            }
            //  RequestInfo requestInfo = createInternalRequestInfo();
            task.setWorkflow(workflow);
            ObjectMapper objectMapper = new ObjectMapper();

            JoinCaseDataV2 joinCaseData = joinCaseRequest.getJoinCaseData();

            JoinCaseTaskRequest taskJoinCase = new JoinCaseTaskRequest();

            List<Advocate> advocatesList = advocateUtil.fetchAdvocatesById(joinCaseRequest.getRequestInfo(), joinCaseData.getRepresentative().getAdvocateId());
            Advocate joinCaseAdvocate = advocatesList.get(0);

            List<Individual> individualsList = individualService.getIndividualsByIndividualId(joinCaseRequest.getRequestInfo(), joinCaseAdvocate.getIndividualId());
            Individual individual = individualsList.get(0);

            IndividualDetails individualDetails = enrichIndividualDetailsInJoinCaseTaskRequest(individual);
            AdvocateDetails advocateDetails = enrichAdvocateDetailsInJoinCaseTaskRequest(individualDetails, joinCaseAdvocate, individual, joinCaseData);

            taskJoinCase.setAdvocateDetails(advocateDetails);

            List<ReplacementDetails> replacementDetailsList = new ArrayList<>();

            joinCaseData.getRepresentative().getRepresenting().forEach(representingJoinCase -> {

                LitigantDetails litigantDetails = new LitigantDetails();
                Party litigant = courtCase.getLitigants().stream().filter(lit -> lit.getIndividualId().equalsIgnoreCase(representingJoinCase.getIndividualId())).findFirst().get();
                litigantDetails.setIndividualId(representingJoinCase.getIndividualId());
                litigantDetails.setPartyType(litigant.getPartyType());

                List<Individual> individualsListForLitigant = individualService.getIndividualsByIndividualId(joinCaseRequest.getRequestInfo(), litigant.getIndividualId());
                Individual individualForLitigant = individualsListForLitigant.get(0);

                // Check if individualForLitigant and its name details are not null
                if (individualForLitigant != null && individualForLitigant.getName() != null) {
                    String name = getName(individualForLitigant);
                    log.warn("Setting individual name details");
                    litigantDetails.setName(name);
                    litigantDetails.setUserUuid(individualForLitigant.getUserUuid());
                }

                if (!representingJoinCase.getIsAlreadyPip()) {
                    representingJoinCase.getReplaceAdvocates().forEach(advocateId -> {
                        ReplacementDetails replacementDetails = new ReplacementDetails();

                        ReplacementAdvocateDetails replacementAdvocateDetails = new ReplacementAdvocateDetails();
                        replacementAdvocateDetails.setAdvocateUuid(advocateId);

                        List<Advocate> replacedvocatesList = advocateUtil.fetchAdvocatesById(joinCaseRequest.getRequestInfo(), advocateId);
                        Advocate replaceAdvocate = replacedvocatesList.get(0);

                        List<Individual> individualList = individualService.getIndividualsByIndividualId(joinCaseRequest.getRequestInfo(), replaceAdvocate.getIndividualId());
                        Individual individualAdvocate = individualList.get(0);

                        String name = getName(individualAdvocate);
                        replacementAdvocateDetails.setBarRegistrationNumber(replaceAdvocate.getBarRegistrationNumber());
                        replacementAdvocateDetails.setMobileNumber(individualAdvocate.getMobileNumber());
                        replacementAdvocateDetails.setName(name);
                        replacementAdvocateDetails.setUserUuid(individualAdvocate.getUserUuid());

                        replacementDetails.setAdvocateDetails(replacementAdvocateDetails);

                        replacementDetails.setIsLitigantPip(representingJoinCase.getIsAlreadyPip());

                        replacementDetails.setLitigantDetails(litigantDetails);

                        if (representingJoinCase.getDocuments() != null && !representingJoinCase.getDocuments().isEmpty()) {
                            ReplacementDocumentDetails document = new ReplacementDocumentDetails();
                            document.setFileStore(representingJoinCase.getDocuments().get(0).getFileStore());
                            document.setDocumentType(representingJoinCase.getDocuments().get(0).getDocumentType());
                            document.setAdditionalDetails(representingJoinCase.getDocuments().get(0).getAdditionalDetails());
                            replacementDetails.setDocument(document);
                        }
                        replacementDetailsList.add(replacementDetails);
                    });
                } else {
                    ReplacementDetails replacementDetails = new ReplacementDetails();

                    replacementDetails.setIsLitigantPip(representingJoinCase.getIsAlreadyPip());
                    replacementDetails.setLitigantDetails(litigantDetails);

                    if (representingJoinCase.getDocuments() != null && !representingJoinCase.getDocuments().isEmpty()) {
                        ReplacementDocumentDetails document = new ReplacementDocumentDetails();
                        document.setFileStore(representingJoinCase.getDocuments().get(0).getFileStore());
                        document.setDocumentType(representingJoinCase.getDocuments().get(0).getDocumentType());
                        document.setAdditionalDetails(representingJoinCase.getDocuments().get(0).getAdditionalDetails());
                        replacementDetails.setDocument(document);
                    }
                    replacementDetailsList.add(replacementDetails);
                }

            });

            taskJoinCase.setReplacementDetails(replacementDetailsList);
            taskJoinCase.setAdvocateDetails(advocateDetails);
            taskJoinCase.setReason(joinCaseData.getRepresentative().getReason());
            taskJoinCase.setReasonDocument(joinCaseRequest.getJoinCaseData().getRepresentative().getReasonDocument());

            Object taskDetails = objectMapper.convertValue(taskJoinCase, Object.class);
            task.setTaskDetails(taskDetails);

            taskRequest.setTask(task);
            RequestInfo requestInfo = joinCaseRequest.getRequestInfo();
            Role role = Role.builder().code("TASK_CREATOR").name("TASK_CREATOR").tenantId(joinCaseAdvocate.getTenantId()).build();
            requestInfo.getUserInfo().getRoles().add(role);
            taskRequest.setRequestInfo(requestInfo);
            return taskUtil.callCreateTask(taskRequest);

        } catch (Exception e) {
            log.error("Error occurred while creating task for join case request :: {}", e.toString());
            throw new CustomException(JOIN_CASE_ERR, TASK_SERVICE_ERROR);
        }
    }

    private RequestInfo createInternalRequestInfo() {
        User userInfo = new User();
        userInfo.setType(SYSTEM);
        userInfo.setUuid(userService.internalMicroserviceRoleUuid);
        userInfo.setRoles(userService.internalMicroserviceRoles);
        userInfo.setTenantId(config.getTenantId());
        return RequestInfo.builder().userInfo(userInfo).msgId(msgId).build();
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
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to verify the given litigants and representatives to be added to the case :: {}", e.toString());
            throw new CustomException(JOIN_CASE_ERR, JOIN_CASE_CODE_INVALID_REQUEST);
        }
    }

    private String createTaskAndDemand(JoinCaseV2Request joinCaseRequest, List<Calculation> calculationList) {
        TaskRequest taskRequest = new TaskRequest();
        Task task = new Task();
        task.setTaskType(JOIN_CASE_PAYMENT);
        task.setStatus("");
        task.setTenantId(joinCaseRequest.getJoinCaseData().getTenantId());
        task.setFilingNumber(joinCaseRequest.getJoinCaseData().getFilingNumber());
        String advocateUUID = joinCaseRequest.getRequestInfo().getUserInfo().getUuid();

        AssignedTo assignedTo = new AssignedTo();
        assignedTo.setUuid(UUID.fromString(advocateUUID));
        task.setAssignedTo(List.of(assignedTo));

        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction("CREATE");
        workflow.setAssignes(List.of(advocateUUID));
        RequestInfo requestInfo = new RequestInfo();
        User userInfo = new User();
        requestInfo.setUserInfo(userInfo);
        requestInfo.getUserInfo().setRoles(userService.internalMicroserviceRoles);
        requestInfo.getUserInfo().setType("SYSTEM");
        requestInfo.getUserInfo().setUuid(userService.internalMicroserviceRoleUuid);
        task.setWorkflow(workflow);
        ObjectMapper objectMapper = new ObjectMapper();

        ObjectNode taskDetailsNode = objectMapper.convertValue(joinCaseRequest, ObjectNode.class);
        taskDetailsNode.put("advocateUuid", advocateUUID);

        ArrayNode breakdownObjectNode = objectMapper.convertValue(calculationList.get(0).getBreakDown(), ArrayNode.class);

        taskDetailsNode.set("paymentBreakdown", breakdownObjectNode);

        task.setTaskDetails(objectMapper.convertValue(taskDetailsNode, Object.class));

        taskRequest.setTask(task);
        taskRequest.setRequestInfo(requestInfo);

        TaskResponse taskResponse = taskUtil.callCreateTask(taskRequest);

        ObjectNode taskDetailsNodeFromResponse = objectMapper.convertValue(taskResponse.getTask().getTaskDetails(), ObjectNode.class);
        String consumerCode = taskDetailsNodeFromResponse.get("consumerCode").asText();

        etreasuryUtil.createDemand(joinCaseRequest, consumerCode, calculationList);

        return taskResponse.getTask().getTaskNumber();

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

    private void disableRepresenting(CourtCase courtCase, String joinCasePartyIndividualId, AuditDetails auditDetails) {
        if (courtCase.getRepresentatives() != null) {
            courtCase.getRepresentatives().forEach(representative -> {

                if (representative.getRepresenting() != null) {
                    representative.getRepresenting().forEach(party -> {
                        //For getting the representing of the representative by the individualID
                        if (joinCasePartyIndividualId.equalsIgnoreCase(party.getIndividualId())) {
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

            });
            producer.push(config.getUpdateRepresentativeJoinCaseTopic(), courtCase);

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

    private void verifyLitigantsAndJoinCase(JoinCaseRequest joinCaseRequest, CourtCase courtCase, CourtCase caseObj, AuditDetails auditDetails) {

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

    private void addLitigantToCase(JoinCaseV2Request joinCaseRequest, CourtCase courtCase, CourtCase caseObj, AuditDetails auditDetails) {

        for (JoinCaseLitigant litigantJoinCase : joinCaseRequest.getJoinCaseData().getLitigant()) {

            if (litigantJoinCase.getIsPip() && litigantJoinCase.getIndividualId() != null) {
                List<Party> litigant = Optional.ofNullable(courtCase.getLitigants())
                        .orElse(Collections.emptyList())
                        .stream()
                        .filter(p -> p.getIndividualId().equalsIgnoreCase(litigantJoinCase.getIndividualId())).collect(Collectors.toList());
                ;

                log.info("litigant size :: {}", litigant.size());
                List<AdvocateMapping> representatives = courtCase.getRepresentatives();

                if (representatives != null && !litigant.isEmpty())
                    disableRepresenting(courtCase, litigant.get(0).getIndividualId(), auditDetails);
            }
        }


        joinCaseRequest.getJoinCaseData().getLitigant().forEach(joinCaseLitigant -> {
            boolean isEvidenceAlreadyPresent = evidenceValidator.validateEvidenceCreate(courtCase, joinCaseRequest.getRequestInfo(), joinCaseLitigant.getDocuments());

            if (!isEvidenceAlreadyPresent) {
                enrichAndCallEvidenceCreate(courtCase, joinCaseLitigant, joinCaseRequest.getRequestInfo());
            }

            if (joinCaseLitigant.getPartyType().contains("complainant") && joinCaseLitigant.getIsPip()) {
                courtCase.setAdditionalDetails(modifyAdvocateDetails(courtCase.getAdditionalDetails(), joinCaseLitigant));
            } else if (joinCaseLitigant.getPartyType().contains("respondent")) {
                courtCase.setAdditionalDetails(updateRespondentDetails(courtCase.getAdditionalDetails(), joinCaseRequest.getRequestInfo(), joinCaseLitigant));
            }
        });

        enrichAndPushLitigantJoinCase(joinCaseRequest, caseObj, courtCase, auditDetails);

        CourtCase encrptedCourtCase = encryptionDecryptionUtil.encryptObject(courtCase, config.getCourtCaseEncryptNew(), CourtCase.class);

        log.info("Pushing additional details :: {}", encrptedCourtCase);
        producer.push(config.getUpdateAdditionalJoinCaseTopic(), encrptedCourtCase);

        updateCourtCaseInRedis(joinCaseRequest.getJoinCaseData().getTenantId(), encrptedCourtCase);

        publishToJoinCaseIndexer(joinCaseRequest.getRequestInfo(), encrptedCourtCase);
    }

    private Object modifyAdvocateDetails(Object additionalDetails, JoinCaseLitigant joinCaseLitigant) {

        ObjectNode additionalDetailsNode = objectMapper.convertValue(additionalDetails, ObjectNode.class);

        // Check if advocateDetails exist
        if (additionalDetailsNode.has("advocateDetails")) {
            ObjectNode advocateDetails = (ObjectNode) additionalDetailsNode.get("advocateDetails");

            // Check if the formdata array exists within advocateDetails
            if (advocateDetails.has("formdata") && advocateDetails.get("formdata").isArray()) {
                ArrayNode formData = (ArrayNode) advocateDetails.get("formdata");

                // Iterate over each element in the formData array
                for (int i = 0; i < formData.size(); i++) {
                    ObjectNode dataNode = (ObjectNode) formData.get(i).get("data");

                    // Get the boxComplainant object for matching the litigant
                    ObjectNode boxComplainant = (ObjectNode) dataNode.get("multipleAdvocatesAndPip").get("boxComplainant");

                    // Skip if the litigant doesn't match

                    if (!(boxComplainant.get("individualId").textValue().equalsIgnoreCase(joinCaseLitigant.getIndividualId()))) {
                        continue;
                    }
                    // Ensure 'multipleAdvocatesAndPip' is an ObjectNode
                    ObjectNode multipleAdvocatesAndPipNode = (ObjectNode) dataNode.get("multipleAdvocatesAndPip");

                    ObjectNode multipleAdvocatesAndPip;
                    if (multipleAdvocatesAndPipNode != null && multipleAdvocatesAndPipNode.isObject()) {
                        multipleAdvocatesAndPip = multipleAdvocatesAndPipNode;
                    } else {
                        multipleAdvocatesAndPip = objectMapper.createObjectNode();
                        dataNode.set("multipleAdvocatesAndPip", multipleAdvocatesAndPip);
                    }

                    // Update isComplainantPip
                    ObjectNode isComplainantPipNode = objectMapper.createObjectNode();
                    isComplainantPipNode.put("code", "YES");
                    isComplainantPipNode.put("name", "yes");
                    isComplainantPipNode.put("isEnabled", true);
                    multipleAdvocatesAndPip.set("isComplainantPip", isComplainantPipNode);

                    // Ensure pipAffidavitFileUpload is initialized and add a new document to it
                    ObjectNode pipAffidavitFileUpload = objectMapper.createObjectNode();

                    // Initialize the 'document' array
                    ArrayNode document = objectMapper.createArrayNode();

                    ObjectNode documentNode = objectMapper.createObjectNode();
                    documentNode.put("documentType", joinCaseLitigant.getDocuments().get(0).getDocumentType());
                    documentNode.put("fileStore", joinCaseLitigant.getDocuments().get(0).getFileStore());

                    document.add(documentNode);
                    pipAffidavitFileUpload.set("document", document);
                    multipleAdvocatesAndPip.set("pipAffidavitFileUpload", pipAffidavitFileUpload);

                    // Ensure vakalatnamaFileUpload is initialized and clear it
                    ArrayNode vakalatnamaFileUpload = ensureArrayNodeInitialized(dataNode.get("multipleAdvocatesAndPip").get("vakalatnamaFileUpload"));
                    vakalatnamaFileUpload.removeAll();

                    // Ensure multipleAdvocateNameDetails is initialized and clear it
                    ArrayNode multipleAdvocateNameDetails = ensureArrayNodeInitialized(dataNode.get("multipleAdvocatesAndPip").get("multipleAdvocateNameDetails"));
                    multipleAdvocateNameDetails.removeAll();

                    // Exit the loop after processing the first matching item
                    break;
                }
            }
        }
        return objectMapper.convertValue(additionalDetailsNode, additionalDetails.getClass());
    }

    // Utility method to ensure ArrayNode is initialized and not null
    private ArrayNode ensureArrayNodeInitialized(JsonNode node) {
        if (node != null && node.isArray()) {
            return (ArrayNode) node;
        } else {
            ArrayNode newArrayNode = objectMapper.createArrayNode();
            return newArrayNode;
        }
    }


    private @NotNull CourtCase validateAccessCodeAndReturnCourtCase(JoinCaseRequest joinCaseRequest, List<CaseCriteria> existingApplications) {
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

    public @NotNull CourtCase validateAccessCodeAndReturnCourtCase(JoinCaseV2Request joinCaseRequest, List<CaseCriteria> existingApplications) {
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

        if (!joinCaseRequest.getJoinCaseData().getAccessCode().equalsIgnoreCase(caseAccessCode)) {
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
            courtCaseRedis.setStageBackup(caseOverallStatus.getStageBackup());
            courtCaseRedis.setSubstageBackup(caseOverallStatus.getSubstageBackup());
        }
        updateCourtCaseInRedis(caseOverallStatus.getTenantId(), courtCaseRedis);
    }

    public void updateCaseOutcome(CaseOutcome caseOutcome) {

        Outcome outcome = caseOutcome.getOutcome();

        CourtCase courtCaseDb = fetchCourtCaseByFilingNumber(caseOutcome.getRequestInfo(), outcome.getFilingNumber());
        CourtCase courtCaseRedis = searchRedisCache(caseOutcome.getRequestInfo(), courtCaseDb.getId().toString());

        if (courtCaseRedis != null) {
            courtCaseRedis.setOutcome(outcome.getOutcome());
            courtCaseRedis.setNatureOfDisposal(outcome.getNatureOfDisposal());
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
        try {
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
        } catch (Exception e) {
            log.error("Error occurred while sending SMS for new witness addition :: {}", e.toString());
        }

    }

    private void smsForOthersAsWitnessAdded(CourtCase courtCase, AddWitnessRequest addWitnessRequest) {
        try {
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
                    .requestInfo(addWitnessRequest.getRequestInfo())
                    .build();
            getAdvocateIndividualId(caseRequest, litigantAndAdvocateIndividualId);
            getPocHolderIndividualIds(caseRequest, litigantAndAdvocateIndividualId);
            Set<String> phoneNumbers = callIndividualService(requestInfo, litigantAndAdvocateIndividualId);
            for (String number : phoneNumbers) {
                notificationService.sendNotification(caseRequest.getRequestInfo(), smsTemplateData, NEW_WITNESS_ADDED_SMS_FOR_OTHERS, number);
            }
        } catch (Exception e) {
            log.error("Error occurred while sending SMS for others as witness added :: {}", e.toString());
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
            String editorUuid = null;
            if (request.getProcessInfo().getAction().equals(ActionType.ACCEPT)) {
                JsonNode profileRequests = additionalDetails.get("profileRequests");
                String idToRemove = null;
                for (JsonNode profile : profileRequests) {
                    if (profile.get("pendingTaskRefId").asText().equals(request.getProcessInfo().getPendingTaskRefId())) {
                        editorUuid = profile.get("editorDetails").get("uuid").asText();
                        String partyType = profile.get("litigantDetails").get("partyType").asText();
                        String uniqueId = profile.get("litigantDetails").get("uniqueId").asText();
                        String detailsKey = partyType.equals("complainant") ? "complainantDetails" : "respondentDetails";

                        JsonNode newDetails = profile.get("newData").get(detailsKey);
                        updatePartyDetails(uniqueId, additionalDetails, newDetails, detailsKey);

                        String individualId;
                        if (detailsKey.equals("respondentDetails")) {
                            individualId = extractIndividualIdIfPresent(additionalDetails, uniqueId);
                            if (individualId == null)
                                log.info("Respondent has not joined case yet.");
                        } else {
                            individualId = uniqueId;
                        }

                        if (individualId != null) {
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
                        editorUuid = profile.get("editorDetails").get("uuid").asText();
                        removeProfileRequest(profile.get("uuid").asText(), profileRequests);
                        ((ObjectNode) additionalDetails).set("profileRequests", objectMapper.convertValue(profileRequests, JsonNode.class));
                        courtCase.setAdditionalDetails(additionalDetails);
                        break;
                    }
                }
            }
            sendProfileProcessNotification(request, courtCase, editorUuid);

            enrichmentUtil.enrichStatuteAndSectionsOnCreateAndUpdate(courtCase, courtCase.getAuditdetails());
            log.info("Encrypting case object with caseId: {}", courtCase.getId());
            courtCase = encryptionDecryptionUtil.encryptObject(courtCase, config.getCourtCaseEncrypt(), CourtCase.class);
            cacheService.save(courtCase.getTenantId() + ":" + courtCase.getId().toString(), courtCase);
            CaseRequest caseRequest = CaseRequest.builder()
                    .requestInfo(request.getRequestInfo())
                    .cases(courtCase)
                    .build();
            producer.push(config.getCaseUpdateTopic(), caseRequest);
            if (request.getProcessInfo().getAction().equals(ActionType.ACCEPT)) {
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

    private void sendProfileProcessNotification(ProcessProfileRequest request, CourtCase courtCase, String editorUuid) {
        CaseRequest caseRequest = CaseRequest.builder()
                .requestInfo(request.getRequestInfo())
                .cases(courtCase)
                .build();
        if (request.getProcessInfo().getAction().equals(ActionType.ACCEPT))
            callNotificationService(caseRequest, ACCEPT_PROFILE_REQUEST, editorUuid);
        else if (request.getProcessInfo().getAction().equals(ActionType.REJECT))
            callNotificationService(caseRequest, REJECT_PROFILE_REQUEST, editorUuid);
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
                    String firstName = newDetails.has("firstName") ? newDetails.get("firstName").asText() : "";
                    String middleName = newDetails.has("middleName") ? newDetails.get("middleName").asText() : "";
                    String lastName = newDetails.has("lastName") ? newDetails.get("lastName").asText() : "";

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
        if (detailsKey.equals("complainantDetails")) {
            String firstName = data.get("data").path("firstName").asText("");
            String middleName = data.get("data").path("middleName").asText("");
            String lastName = data.get("data").path("lastName").asText("");
            fullName = (firstName + " " + middleName + " " + lastName).replaceAll("\\s+", " ").trim();
        } else if (detailsKey.equals("respondentDetails")) {
            String firstName = data.get("data").path("respondentFirstName").asText("");
            String middleName = data.get("data").path("respondentMiddleName").asText("");
            String lastName = data.get("data").path("respondentLastName").asText("");
            fullName = (firstName + " " + middleName + " " + lastName).replaceAll("\\s+", " ").trim();
        }
        return fullName;
    }

    public void updateJoinCaseRejected(TaskRequest taskRequest) {
        try {
            //this method is used rejecting the request
            log.info("operation=updateJoinCaseRejected, status=IN_PROGRESS, pendingTaskId: {}", taskRequest);

            List<CourtCase> courtCaseList = getCaseFromDb(taskRequest);
            Task task = taskRequest.getTask();

            if (courtCaseList.isEmpty()) {
                log.error("no case found for the given criteria");
            } else {
                CourtCase courtCase = courtCaseList.get(0);
                if (!task.getTaskDescription().equalsIgnoreCase("poaJoinCase")) {
                    // get the pending requests of advocates in the case
                    List<PendingAdvocateRequest> pendingAdvocateRequests = courtCase.getPendingAdvocateRequests();
                    JoinCaseTaskRequest joinCaseRequest = objectMapper.convertValue(task.getTaskDetails(), JoinCaseTaskRequest.class);
                    // uuid of advocate who is trying to replace
                    String advocateUuid = joinCaseRequest.getAdvocateDetails().getAdvocateId();
                    String taskNumber = task.getTaskNumber();
                    PendingAdvocateRequest pendingAdvocateRequest = new PendingAdvocateRequest();

                    for (PendingAdvocateRequest request : pendingAdvocateRequests) {
                        // check the pending requests of the advocate in case
                        if (request.getAdvocateId().equalsIgnoreCase(advocateUuid) && request.getTaskReferenceNoList().contains(taskNumber)) {
                            // remove the taskReference number of the pending task from the case object
                            request.getTaskReferenceNoList().remove(taskNumber);
                            pendingAdvocateRequest = request;
                        }
                    }
                    courtCase.setPendingAdvocateRequests(pendingAdvocateRequests);

                    updateStatusOfAdvocate(courtCase, advocateUuid, pendingAdvocateRequest);

                    producer.push(config.getUpdatePendingAdvocateRequestKafkaTopic(), courtCase);
                    updateCourtCaseInRedis(courtCase.getTenantId(), courtCase);
                }

                log.info("operation=updateJoinCaseRejected, status=SUCCESS, taskRequest: {}", taskRequest);
            }
        } catch (CustomException e) {
            log.error("CustomException occurred: {}", e.getMessage(), e);
            throw new CustomException("REJECT_REQUEST_ERROR", e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error in updateJoinCaseRejected: {}", e.getMessage(), e);
            throw new CustomException("REJECT_REQUEST_ERROR", "An unexpected error occurred");
        }

    }

    public void updateJoinCaseApproved(TaskRequest taskRequest) {

        try {

            log.info("operation=updateJoinCaseApproved, status=IN_PROGRESS, taskRequest: {}", taskRequest);

            List<CourtCase> courtCaseList = getCaseFromDb(taskRequest);
            Task task = taskRequest.getTask();
            RequestInfo requestInfo = taskRequest.getRequestInfo();

            if (courtCaseList.isEmpty()) {
                log.error("no case found for the given criteria");
            } else {
                CourtCase courtCase = courtCaseList.get(0);
                courtCase = encryptionDecryptionUtil.decryptObject(courtCase, config.getCaseDecryptSelf(), CourtCase.class, taskRequest.getRequestInfo());
                if ("poaJoinCase".equals(task.getTaskDescription())) {
                    POAJoinCaseTaskRequest joinCaseTaskRequest = objectMapper.convertValue(task.getTaskDetails(), POAJoinCaseTaskRequest.class);
                    validator.isStillValidPOAJoinCase(courtCase, joinCaseTaskRequest);
                    updateCourtCaseObjectPOA(courtCase, joinCaseTaskRequest, requestInfo);
                    poaJoinCaseNotificationsAfterApproval(joinCaseTaskRequest, courtCase, requestInfo);
                } else {
                    // get the pending requests of advocates in the case
                    List<PendingAdvocateRequest> pendingAdvocateRequests = courtCase.getPendingAdvocateRequests();
                    JoinCaseTaskRequest joinCaseRequest = objectMapper.convertValue(task.getTaskDetails(), JoinCaseTaskRequest.class);
                    // uuid of advocate who is trying to replace
                    String advocateUuid = joinCaseRequest.getAdvocateDetails().getAdvocateId();
                    String taskNumber = task.getTaskNumber();

                    PendingAdvocateRequest pendingAdvocateRequest = new PendingAdvocateRequest();

                    for (PendingAdvocateRequest request : pendingAdvocateRequests) {
                        // check the pending requests of the advocate in case
                        if (request.getAdvocateId().equalsIgnoreCase(advocateUuid) && request.getTaskReferenceNoList().contains(taskNumber)) {
                            // remove the taskReference number of the pending task from the case object
                            request.getTaskReferenceNoList().remove(taskNumber);
                            pendingAdvocateRequest = request;
                        }
                    }
                    courtCase.setPendingAdvocateRequests(pendingAdvocateRequests);

                    updateCourtCaseObject(courtCase, joinCaseRequest, advocateUuid, requestInfo, pendingAdvocateRequest);

                    log.info("operation=updateJoinCaseApproved, status=SUCCESS, taskRequest: {}", taskRequest);

                    joinCaseNotificationsAfterApproval(joinCaseRequest, courtCase, requestInfo);
                }

            }
        } catch (CustomException e) {
            log.error("CustomException occurred: {}", e.getMessage(), e);
            throw new CustomException("APPROVAL_REQUEST_ERROR", e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error in updateJoinCaseRejected: {}", e.getMessage(), e);
            throw new CustomException("APPROVAL_REQUEST_ERROR", "An unexpected error occurred");
        }

    }

    private void poaJoinCaseNotificationsAfterApproval(POAJoinCaseTaskRequest joinCaseTaskRequest, CourtCase courtCase, RequestInfo requestInfo) {

        try {
            Set<String> individualIdSet = joinCaseTaskRequest.getIndividualDetails().stream().map(POAIndividualDetails::getIndividualId).collect(Collectors.toSet());
            individualIdSet.addAll(joinCaseTaskRequest.getIndividualDetails().stream().map(POAIndividualDetails::getExistingPoaIndividualId).toList());

            individualIdSet.add(joinCaseTaskRequest.getPoaDetails().getIndividualId());
            individualIdSet.addAll(getPocHolderIndividualIdsOfLitigants(courtCase, individualIdSet));
            individualIdSet.addAll(getLitigantIndividualId(courtCase));

            CaseRequest caseRequest = CaseRequest.builder().requestInfo(requestInfo).cases(courtCase).build();
            getAdvocateIndividualId(caseRequest, individualIdSet);

            SmsTemplateData smsTemplateData = SmsTemplateData.builder()
                    .cmpNumber(courtCase.getCmpNumber())
                    .efilingNumber(courtCase.getFilingNumber())
                    .tenantId(courtCase.getTenantId())
                    .build();

            Set<String> phoneNumbersOfUsers = callIndividualService(requestInfo, individualIdSet);

            log.info("sending new user join sms to {} users", phoneNumbersOfUsers.size());

            for (String phoneNumber : phoneNumbersOfUsers) {
                notificationService.sendNotification(requestInfo, smsTemplateData, NEW_USER_JOIN, phoneNumber);
            }
        } catch (Exception e) {
            log.error("Error occurred while sending notification: {}", e.toString());
        }


    }

    private void joinCaseNotificationsAfterApproval(JoinCaseTaskRequest joinCaseTaskRequest, CourtCase courtCase, RequestInfo requestInfo) {

        try {

            AdvocateDetails individualTryingToReplace = joinCaseTaskRequest.getAdvocateDetails();

            IndividualDetails individualDetails = individualTryingToReplace.getIndividualDetails();

            // send notification to the parties and advocates

            Set<String> individualIdSet = joinCaseTaskRequest.getReplacementDetails().stream().map(ReplacementDetails::getLitigantDetails).map(LitigantDetails::getIndividualId).collect(Collectors.toSet());
            Set<String> individualIdSetOfPoaHoldersOfLitigants = getPocHolderIndividualIdsOfLitigants(courtCase, individualIdSet);
            individualIdSet.addAll(individualIdSetOfPoaHoldersOfLitigants);
            Set<String> phoneNumbers = callIndividualService(requestInfo, individualIdSet);

            List<String> nameParts = Stream.of(individualDetails.getFirstName(),
                            individualDetails.getMiddleName(),
                            individualDetails.getLastName())
                    .filter(part -> part != null && !part.isEmpty())
                    .toList();

            String fullName = String.join(" ", nameParts);

            SmsTemplateData smsTemplateData = SmsTemplateData.builder()
                    .cmpNumber(courtCase.getCmpNumber())
                    .efilingNumber(courtCase.getFilingNumber())
                    .advocateName(fullName)
                    .tenantId(courtCase.getTenantId()).build();
            for (String number : phoneNumbers) {
                notificationService.sendNotification(requestInfo, smsTemplateData, ADVOCATE_CASE_JOIN, number);
            }

            log.info("sending new advocate join sms to {} users", phoneNumbers.size());

            // send sms to remaining users that a new user is joined

            Set<String> individualIdSetOfRemainingUsers = getLitigantIndividualId(courtCase);

            CaseRequest caseRequest = CaseRequest.builder().requestInfo(requestInfo).cases(courtCase).build();

            getAdvocateIndividualId(caseRequest, individualIdSetOfRemainingUsers);

            individualIdSetOfRemainingUsers.addAll(
                    courtCase.getRepresentatives().stream()
                            .flatMap(advocateMapping -> advocateMapping.getRepresenting().stream())
                            .map(Party::getIndividualId)
                            .collect(Collectors.toSet())
            );

            individualIdSetOfRemainingUsers.removeAll(individualIdSet);

            Set<String> phoneNumbersOfRemainingUsers = callIndividualService(requestInfo, individualIdSetOfRemainingUsers);

            log.info("sending new user join sms to {} users", phoneNumbersOfRemainingUsers.size());

            for (String phoneNumber : phoneNumbersOfRemainingUsers) {
                notificationService.sendNotification(requestInfo, smsTemplateData, NEW_USER_JOIN, phoneNumber);
            }
        } catch (Exception e) {
            log.error("Error occurred while sending notification: {}", e.toString());
        }


    }

    private void joinCaseNotificationsForDirectJoinOfAdvocate(JoinCaseV2Request joinCaseRequest, CourtCase courtCase) {

        JoinCaseDataV2 joinCaseData = joinCaseRequest.getJoinCaseData();

        Set<String> individualIdSet = null;


        SmsTemplateData smsTemplateData = SmsTemplateData.builder()
                .cmpNumber(courtCase.getCmpNumber())
                .efilingNumber(courtCase.getFilingNumber())
                .tenantId(courtCase.getTenantId()).build();

        if (joinCaseData.getRepresentative() != null) {

            // send advocate joined sms to respective advocate parties
            individualIdSet = joinCaseData.getRepresentative().getRepresenting().stream().map(RepresentingJoinCase::getIndividualId).collect(Collectors.toSet());

            Set<String> individualIdSetOfPoaHoldersOfLitigants = getPocHolderIndividualIdsOfLitigants(courtCase, individualIdSet);
            individualIdSet.addAll(individualIdSetOfPoaHoldersOfLitigants);

            Set<String> phoneNumbers = callIndividualService(joinCaseRequest.getRequestInfo(), individualIdSet);
            String advocateId = joinCaseRequest.getJoinCaseData().getRepresentative().getAdvocateId();

            Optional<AdvocateMapping> advocateMapping = courtCase.getRepresentatives().stream().filter(advocateMapping1 ->
                    advocateMapping1.getAdvocateId().equalsIgnoreCase(advocateId)).findFirst();

            LinkedHashMap advocate = null;

            if (advocateMapping.isPresent()) {
                advocate = objectMapper.convertValue(advocateMapping.get().getAdditionalDetails(), LinkedHashMap.class);
            }

            String advocateName = advocate != null ? advocate.get(ADVOCATE_NAME).toString() : "";

            smsTemplateData.setAdvocateName(advocateName);

            for (String number : phoneNumbers) {
                notificationService.sendNotification(joinCaseRequest.getRequestInfo(), smsTemplateData, ADVOCATE_CASE_JOIN, number);
            }
        }

        // send sms to remaining users that a new user is joined

        Set<String> individualIdSetOfRemainingUsers = getLitigantIndividualId(courtCase);

        CaseRequest caseRequest = CaseRequest.builder().requestInfo(joinCaseRequest.getRequestInfo()).cases(courtCase).build();

        getAdvocateIndividualId(caseRequest, individualIdSetOfRemainingUsers);

        individualIdSetOfRemainingUsers.addAll(
                courtCase.getRepresentatives().stream()
                        .flatMap(advocateMapping -> advocateMapping.getRepresenting().stream())
                        .map(Party::getIndividualId)
                        .collect(Collectors.toSet())
        );

        if (individualIdSet != null) {
            individualIdSetOfRemainingUsers.removeAll(individualIdSet);
        }

        Set<String> phoneNumbersOfRemainingUsers = callIndividualService(joinCaseRequest.getRequestInfo(), individualIdSetOfRemainingUsers);

        for (String phoneNumber : phoneNumbersOfRemainingUsers) {
            notificationService.sendNotification(joinCaseRequest.getRequestInfo(), smsTemplateData, NEW_USER_JOIN, phoneNumber);
        }

    }

    private List<CourtCase> getCaseFromDb(TaskRequest taskRequest) {
        Task task = taskRequest.getTask();
        RequestInfo requestInfo = taskRequest.getRequestInfo();

        String filingNumber = task.getFilingNumber();
        CaseCriteria caseCriteria = CaseCriteria.builder()
                .filingNumber(filingNumber)
                .build();
        List<CaseCriteria> caseSearchCriteria = List.of(caseCriteria);

        CaseCriteria caseCriteriaResponse = caseRepository.getCases(caseSearchCriteria, requestInfo).get(0);

        return caseCriteriaResponse.getResponseList();
    }

    private void updateCourtCaseObjectPOA(CourtCase courtCase, POAJoinCaseTaskRequest joinCaseRequest, RequestInfo requestInfo) {

        try {
            log.info("operation=updateCourtCaseObjectPOA, status=IN_PROGRESS, poaJoinCaseRequest: {}", joinCaseRequest);

            String poaIndividualId = joinCaseRequest.getPoaDetails().getIndividualId();
            if (courtCase.getPoaHolders() == null) {
                courtCase.setPoaHolders(new ArrayList<>());
            }

            AuditDetails auditDetails = enrichAuditDetails(requestInfo);

            List<POAIndividualDetails> poaIndividualDetailsList = joinCaseRequest.getIndividualDetails();

            for (POAIndividualDetails poaIndividualDetails : poaIndividualDetailsList) {
                log.info("Poa party :: {}", poaIndividualDetails);
                //revoking existing poa
                if (poaIndividualDetails.getIsRevoking()) {
                    POAHolder poaHolderToBeReplaced = courtCase.getPoaHolders().stream().filter(poaHolder -> poaHolder.getIndividualId().equals(poaIndividualDetails.getExistingPoaIndividualId())).findFirst().orElse(null);
                    poaHolderToBeReplaced.getRepresentingLitigants().stream().filter(poaParty -> poaParty.getIndividualId().equals(poaIndividualDetails.getIndividualId())).findFirst().ifPresent(poaParty -> poaParty.setIsActive(false));
                    if (poaHolderToBeReplaced.getRepresentingLitigants().stream().filter(PoaParty::getIsActive).toList().isEmpty()) {
                        poaHolderToBeReplaced.setIsActive(false);
                    }

                    removePOAFromAdditionalDetails(courtCase, poaIndividualDetails);
                }

                //adding new poa/party if litigant is not revoking his own poa
                if (!poaIndividualId.equalsIgnoreCase(poaIndividualDetails.getIndividualId())) {
                    Document documentPoaAuth = poaIndividualDetails.getPoaAuthDocument();
                    String uuid = UUID.randomUUID().toString();
                    documentPoaAuth.setId(uuid);
                    documentPoaAuth.setDocumentUid(uuid);

                    PoaParty newPoaParty = PoaParty.builder()
                            .individualId(poaIndividualDetails.getIndividualId())
                            .isActive(true)
                            .caseId(courtCase.getId().toString())
                            .id(UUID.randomUUID().toString())
                            .documents(Collections.singletonList(documentPoaAuth))
                            .build();

                        Optional<POAHolder> existingPoaHolder = courtCase.getPoaHolders()
                                .stream()
                                .filter(poaHolder -> poaHolder.getIndividualId().equalsIgnoreCase(poaIndividualId))
                                .findFirst();

                        if (existingPoaHolder.isPresent()) {
                            existingPoaHolder.get().getRepresentingLitigants().add(newPoaParty);
                        } else {
                            POAHolder newPoaHolder = new POAHolder();
                            newPoaHolder.setIndividualId(poaIndividualId);
                            newPoaHolder.setCaseId(courtCase.getId().toString());
                            newPoaHolder.setHasSigned(false);
                            List<String> nameParts = Stream.of(joinCaseRequest.getPoaDetails().getFirstName(),
                                            joinCaseRequest.getPoaDetails().getMiddleName(),
                                            joinCaseRequest.getPoaDetails().getLastName())
                                    .filter(part -> part != null && !part.isEmpty())
                                    .toList();

                            String fullName = String.join(" ", nameParts);
                            newPoaHolder.setName(fullName);
                            newPoaHolder.setId(UUID.randomUUID().toString());
                            newPoaHolder.setAuditDetails(auditDetails);
                            newPoaHolder.setIsActive(true);
                            newPoaHolder.setPoaType("poa.regular");

                            Map<String, String> additionalDetails = new HashMap<>();
                            additionalDetails.put("uuid", joinCaseRequest.getPoaDetails().getUserUuid());

                            newPoaHolder.setAdditionalDetails(additionalDetails);

                            newPoaHolder.setTenantId(courtCase.getTenantId());
                            newPoaHolder.setDocuments(Collections.singletonList(joinCaseRequest.getPoaDetails().getIdDocument()));

                            newPoaHolder.setRepresentingLitigants(new ArrayList<>(List.of(newPoaParty)));
                            courtCase.getPoaHolders().add(newPoaHolder);
                        }

                    if (poaIndividualDetails.getUniqueId() == null) {
                        enrichAdditionalDetailsPOAComplainant(courtCase, joinCaseRequest.getPoaDetails(), poaIndividualDetails);
                    } else {
                        enrichAdditionalDetailsPOARespondent(courtCase, joinCaseRequest.getPoaDetails(), poaIndividualDetails);
                    }
                }
            }

            courtCase.getAuditdetails().setLastModifiedBy(requestInfo.getUserInfo().getUuid());
            courtCase.getAuditdetails().setLastModifiedTime(System.currentTimeMillis());

            CourtCase encrptedCourtCase = encryptionDecryptionUtil.encryptObject(courtCase, config.getCourtCaseEncrypt(), CourtCase.class);
            updateCourtCaseInRedis(courtCase.getTenantId(), encrptedCourtCase);

            producer.push(config.getPoaJoinCaseKafkaTopic(), encrptedCourtCase);

        } catch (CustomException e) {
            log.error("CustomException occurred: {}", e.getMessage(), e);
            throw new CustomException("updateCourtCaseObjectPOA", e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error in updateCourtCaseObjectPOA: {}", e.getMessage(), e);
            throw new CustomException("updateCourtCaseObjectPOA", "An unexpected error occurred");
        }

    }

    public void removePOAFromAdditionalDetails(CourtCase courtCase, POAIndividualDetails poaIndividualDetails) {
        String key = poaIndividualDetails.getUniqueId() == null ? "complainantDetails" : "respondentDetails";

        Object additionalDetails = courtCase.getAdditionalDetails();
        JsonNode additionalDetailsJsonNode = objectMapper.convertValue(additionalDetails, JsonNode.class);
        ArrayNode formData = (ArrayNode) additionalDetailsJsonNode.get(key).get("formdata");

        if (poaIndividualDetails.getUniqueId() != null) {

            for (int i = 0; i < formData.size(); i++) {
                ObjectNode dataNode = (ObjectNode) formData.get(i).path("data");

                log.info("respondent dataNode :: {}", dataNode);
                String uniqueIdRespondent = formData.get(i).get("uniqueId").asText();

                if (uniqueIdRespondent.equalsIgnoreCase(poaIndividualDetails.getUniqueId())) {
                    dataNode.remove("poaFirstName");
                    dataNode.remove("poaMiddleName");
                    dataNode.remove("poaLastName");
                    dataNode.remove("poaVerification");
                    dataNode.remove("poaComplainantId");
                    dataNode.remove("poaAddressDetails");
                    dataNode.remove("poaAddressDetails-select");
                    dataNode.remove("poaAuthorizationDocument");
                    ObjectNode transferredPOA = (ObjectNode) dataNode.get("transferredPOA");
                    if (transferredPOA != null) {
                        transferredPOA.put("code", "NO");
                        transferredPOA.put("name", "NO");
                        transferredPOA.put("showPoaDetails", false);
                    }
                    break;
                }
            }
        } else {
            for (JsonNode formNode : formData) {
                ObjectNode dataNode = (ObjectNode) formNode.get("data");

                JsonNode verification = dataNode.path("complainantVerification")
                        .path("individualDetails")
                        .path("individualId");

                if (verification.isTextual() &&
                        poaIndividualDetails.getIndividualId().equalsIgnoreCase(verification.asText())) {

                    dataNode.remove("poaFirstName");
                    dataNode.remove("poaMiddleName");
                    dataNode.remove("poaLastName");
                    dataNode.remove("poaVerification");
                    dataNode.remove("poaComplainantId");
                    dataNode.remove("poaAddressDetails");
                    dataNode.remove("poaAddressDetails-select");
                    dataNode.remove("poaAuthorizationDocument");
                    ObjectNode transferredPOA = (ObjectNode) dataNode.get("transferredPOA");
                    if (transferredPOA != null) {
                        transferredPOA.put("code", "NO");
                        transferredPOA.put("name", "NO");
                        transferredPOA.put("showPoaDetails", false);
                    }
                    break;
                }
            }
        }
        courtCase.setAdditionalDetails(objectMapper.convertValue(additionalDetailsJsonNode, Object.class));
    }

    public void enrichAdditionalDetailsPOAComplainant(CourtCase courtCase, POADetails poaDetails, POAIndividualDetails poaIndividualDetails) {
        Object additionalDetails = courtCase.getAdditionalDetails();
        JsonNode additionalDetailsJsonNode = objectMapper.convertValue(additionalDetails, JsonNode.class);
        ArrayNode formData = (ArrayNode) additionalDetailsJsonNode.get("complainantDetails").get("formdata");

        for (JsonNode formNode : formData) {
            ObjectNode dataNode = (ObjectNode) formNode.get("data");

            JsonNode verification = dataNode.path("complainantVerification")
                    .path("individualDetails")
                    .path("individualId");

            if (verification.isTextual() && poaIndividualDetails.getIndividualId().equalsIgnoreCase(verification.asText())) {
                enrichAdditionalDetails(poaDetails, poaIndividualDetails, dataNode);
                break;
            }
        }
        courtCase.setAdditionalDetails(objectMapper.convertValue(additionalDetailsJsonNode, Object.class));
    }

    public void enrichAdditionalDetailsPOARespondent(CourtCase courtCase, POADetails poaDetails, POAIndividualDetails poaIndividualDetails) {
        Object additionalDetails = courtCase.getAdditionalDetails();
        JsonNode additionalDetailsJsonNode = objectMapper.convertValue(additionalDetails, JsonNode.class);
        ArrayNode formData = (ArrayNode) additionalDetailsJsonNode.get("respondentDetails").get("formdata");

        for (int i = 0; i < formData.size(); i++) {
            ObjectNode dataNode = (ObjectNode) formData.get(i).path("data");

            log.info("dataNode :: {}", dataNode);
            String uniqueIdRespondent = formData.get(i).get("uniqueId").asText();

            if (uniqueIdRespondent.equalsIgnoreCase(poaIndividualDetails.getUniqueId())) {
                enrichAdditionalDetails(poaDetails, poaIndividualDetails, dataNode);
                break;
            }
        }
        courtCase.setAdditionalDetails(objectMapper.convertValue(additionalDetailsJsonNode, Object.class));
    }

    private void enrichAdditionalDetails(POADetails poaDetails, POAIndividualDetails poaIndividualDetails, ObjectNode data) {
        // Add POA Name fields
        data.put("poaFirstName", poaDetails.getFirstName());
        data.put("poaMiddleName", poaDetails.getMiddleName());
        data.put("poaLastName", poaDetails.getLastName());

        // Add transferred POA flag
        ObjectNode transferredPOA = data.putObject("transferredPOA");
        transferredPOA.put("code", "YES");
        transferredPOA.put("name", "YES");
        transferredPOA.put("showPoaDetails", true);

        // Add POA Address
        JsonNode addressNode = objectMapper.convertValue(poaDetails.getAddress(), JsonNode.class);
        data.set("poaAddressDetails", addressNode);
        data.set("poaAddressDetails-select", addressNode);

        // Add POA Verification block
        ObjectNode poaVerification = data.putObject("poaVerification");
        poaVerification.put("otpNumber", "");
        poaVerification.put("mobileNumber", poaDetails.getMobileNumber());
        poaVerification.put("isUserVerified", true);

        // Add individualDetails inside poaVerification
        ObjectNode individualDetails = objectMapper.createObjectNode();
        individualDetails.put("userUuid", poaDetails.getUserUuid());
        individualDetails.put("individualId", poaDetails.getIndividualId());
        individualDetails.set("poaAddressDetails", addressNode);
        individualDetails.set("poaAddressDetails-select", addressNode);

        // Add POA ID Proof Document
        ArrayNode documentArray = individualDetails.putArray("document");
        ObjectNode document = documentArray.addObject();
        document.put("fileStore", poaDetails.getIdDocument().getFileStore());

        JsonNode docAdditionalDetailsIdProof = objectMapper.convertValue(
                poaDetails.getIdDocument().getAdditionalDetails(), JsonNode.class
        );
        document.put("documentName", docAdditionalDetailsIdProof.get("documentName").asText());
        document.put("documentType", poaDetails.getIdDocument().getDocumentType());

        poaVerification.set("individualDetails", individualDetails);

        // Create poaComplainantId nested structure
        ObjectNode fileNode = objectMapper.createObjectNode();
        fileNode.put("fileStore", poaDetails.getIdDocument().getFileStore());
        fileNode.put("documentName", docAdditionalDetailsIdProof.get("documentName").asText());
        fileNode.put("documentType", poaDetails.getIdDocument().getDocumentType());

        ObjectNode innerMap = objectMapper.createObjectNode();
        innerMap.set("file", fileNode);
        innerMap.put("fileStoreId", poaDetails.getIdDocument().getFileStore());

        ArrayNode idProofList = objectMapper.createArrayNode();
        idProofList.add(poaDetails.getIdDocument().getDocumentType());
        idProofList.add(innerMap);

        ObjectNode poaComplainantIdLevel3 = objectMapper.createObjectNode();
        poaComplainantIdLevel3.set("ID_Proof", objectMapper.createArrayNode().add(idProofList));

        ObjectNode poaComplainantIdLevel2 = objectMapper.createObjectNode();
        poaComplainantIdLevel2.set("poaComplainantId", poaComplainantIdLevel3);

        ObjectNode poaComplainantIdLevel1 = objectMapper.createObjectNode();
        poaComplainantIdLevel1.set("poaComplainantId", poaComplainantIdLevel2);

        data.set("poaComplainantId", poaComplainantIdLevel1);

        // Add POA Authorization Document
        ObjectNode poaAuthDoc = data.putObject("poaAuthorizationDocument");
        ArrayNode authDocArray = poaAuthDoc.putArray("poaDocument");

        ObjectNode authDoc = authDocArray.addObject();
        authDoc.put("documentType", poaIndividualDetails.getPoaAuthDocument().getDocumentType());
        authDoc.put("fileStore", poaIndividualDetails.getPoaAuthDocument().getFileStore());

        JsonNode docAdditionalDetails = objectMapper.convertValue(
                poaIndividualDetails.getPoaAuthDocument().getAdditionalDetails(), JsonNode.class
        );
        authDoc.put("fileName", docAdditionalDetails.get("fileName").asText());
        authDoc.put("documentName", docAdditionalDetails.get("documentName").asText());
    }

    private void updateCourtCaseObject(CourtCase courtCase, JoinCaseTaskRequest joinCaseRequest, String
            advocateUuid,
                                       RequestInfo requestInfo, PendingAdvocateRequest pendingAdvocateRequest) {

        try {

            log.info("operation=updateJoinCaseApproved, status=IN_PROGRESS, joinCaseRequest, advocateUuid : {}, {}", joinCaseRequest, advocateUuid);

            List<AdvocateMapping> advocateMappings = courtCase.getRepresentatives();

            // checking weather advocate is present in case or not
            AdvocateMapping advocateTryingToReplace = advocateMappings.stream().filter(advocateMapping ->
                    advocateMapping.getAdvocateId().equalsIgnoreCase(advocateUuid)).findFirst().orElse(null);

            AuditDetails auditDetails = enrichAuditDetails(requestInfo);

            CourtCase courtCaseObj = CourtCase.builder()
                    .filingNumber(courtCase.getFilingNumber())
                    .auditdetails(auditDetails)
                    .tenantId(courtCase.getTenantId())
                    .id(courtCase.getId())
                    .build();


            List<ReplacementDetails> replacementDetailsList = joinCaseRequest.getReplacementDetails();
            AdvocateDetails advocateDetails = joinCaseRequest.getAdvocateDetails();

            for (ReplacementDetails replacementDetails : replacementDetailsList) {

                Party party = enrichParty(replacementDetails, courtCase, auditDetails);
                LitigantDetails litigantDetails = replacementDetails.getLitigantDetails();
                String partyType = litigantDetails.getPartyType();
                ReplacementAdvocateDetails advocateDetailsToBeReplaced = new ReplacementAdvocateDetails();
                String advocateUuidToBeReplaced = null;
                if (!replacementDetails.getIsLitigantPip()) {
                    advocateDetailsToBeReplaced = replacementDetails.getAdvocateDetails();
                    advocateUuidToBeReplaced = advocateDetailsToBeReplaced.getAdvocateUuid();
                }
                if (replacementDetails.getIsLitigantPip()) {
                    List<Party> litigantParties = courtCase.getLitigants();
                    if (advocateTryingToReplace == null) {
                        // adding the advocate in representatives list as he is new joining the case
                        advocateTryingToReplace = enrichAdvocateDetailsInRepresentativesList(courtCase, advocateUuid, replacementDetails, party, auditDetails, advocateDetails, courtCaseObj);
                    } else {
                        // Extract the else block logic to a separate method
                        updateExistingAdvocateMapping(
                                courtCase, advocateUuid, party, advocateMappings,
                                advocateTryingToReplace, courtCaseObj
                        );
                    }
                    for (Party litigantParty : litigantParties) {
                        if (litigantParty.getIndividualId().equalsIgnoreCase(litigantDetails.getIndividualId())) {
                            // inactive the litigant from pip as advocate going to represent him
                            litigantParty.setPartyInPerson(false);
                        }
                    }
                } else {
                    if (advocateTryingToReplace == null) {
                        // adding the advocate in representatives list as he is new joining the case
                        advocateTryingToReplace = enrichAdvocateDetailsInRepresentativesList(courtCase, advocateUuid, replacementDetails, party, auditDetails, advocateDetails, courtCaseObj);
                    } else {
                        // Extract the else block logic to a separate method
                        updateExistingAdvocateMapping(
                                courtCase, advocateUuid, party, advocateMappings,
                                advocateTryingToReplace, courtCaseObj
                        );
                    }
                    if (!replacementDetails.getIsLitigantPip()) {
                        inactivateOldAdvocate(replacementDetails, courtCase);
                    }
                }

                producer.push(config.getRepresentativeJoinCaseTopic(), courtCaseObj);

                if (partyType.contains("complainant")) {
                    Object additionalDetails = courtCase.getAdditionalDetails();
                    JsonNode additionalDetailsJsonNode = objectMapper.convertValue(additionalDetails, JsonNode.class);
                    JsonNode newAdvoacteDetailsJsonNode = enrichNewAdvocateDetails(advocateDetails, replacementDetails);
                    enrichAdditionalDetails(courtCase, additionalDetailsJsonNode, replacementDetails, litigantDetails.getIndividualId(), advocateUuidToBeReplaced, newAdvoacteDetailsJsonNode);
                } else {
                    CourtCase encrptedCourtCase = encryptionDecryptionUtil.encryptObject(courtCase, config.getCourtCaseEncrypt(), CourtCase.class);
                    updateCourtCaseInRedis(courtCase.getTenantId(), encrptedCourtCase);
                }

                // create evidence for vakalatnama document submitted

                if (replacementDetails.getDocument() != null) {
                    boolean isEvidenceAlreadyPresent = evidenceValidator.validateEvidenceCreation(courtCase, requestInfo, replacementDetails);

                    if (!isEvidenceAlreadyPresent) {
                        EvidenceRequest evidenceRequest = enrichEvidenceCreateRequest(courtCase, replacementDetails, requestInfo);

                        evidenceUtil.createEvidence(evidenceRequest);
                    }
                }

                enrichHearingDetails(courtCase, replacementDetails, joinCaseRequest, requestInfo);

                log.info("operation=updateJoinCaseApproved, status=SUCCESS, joinCaseRequest, advocateUuid : {}, {}", joinCaseRequest, advocateUuid);
            }

            updateStatusOfAdvocate(courtCase, advocateUuid, pendingAdvocateRequest);

            producer.push(config.getUpdatePendingAdvocateRequestKafkaTopic(), courtCase);

            // evidence submission of reason document as well

            if (joinCaseRequest.getReasonDocument() != null && joinCaseRequest.getReasonDocument().getFileStore() != null) {
                boolean isReasonDocumentAlreadySubmitted = evidenceValidator.validateReasonDocumentCreation(courtCase, requestInfo, joinCaseRequest.getReasonDocument());

                if (!isReasonDocumentAlreadySubmitted) {
                    EvidenceRequest evidenceRequest = enrichEvidenceCreateRequestForReasonDocument(courtCase, joinCaseRequest, requestInfo);
                    evidenceUtil.createEvidence(evidenceRequest);
                }
            }
        } catch (CustomException e) {
            log.error("CustomException occurred: {}", e.getMessage(), e);
            throw new CustomException("updateCourtCaseObject", e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error in updateCourtCaseObject: {}", e.getMessage(), e);
            throw new CustomException("updateCourtCaseObject", "An unexpected error occurred");
        }

    }

    private boolean validateAdvocateAlreadyRepresenting(AdvocateMapping advocateMapping, String
            litigantIndividualId) {
        Party party = advocateMapping.getRepresenting().stream()
                .filter(representing -> representing.getIndividualId().equalsIgnoreCase(litigantIndividualId)).findFirst().orElse(null);
        return party != null && party.getIsActive();
    }

    private void inactivateOldAdvocate(ReplacementDetails replacementDetails, CourtCase courtCase) {
        log.info("operation=inactivateOldAdvocate, status=IN_PROGRESS");
        String advocateId = replacementDetails.getAdvocateDetails().getAdvocateUuid();
        String litigantId = replacementDetails.getLitigantDetails().getIndividualId();
        //  remove the litigant in old advocate's representing list as another advocate is trying to replace

        courtCase.getRepresentatives().stream()
                .filter(mapping -> mapping.getAdvocateId().equalsIgnoreCase(advocateId))
                .findFirst()
                .ifPresent(mapping -> {
                    mapping.getRepresenting().stream()
                            .filter(representing -> representing.getIndividualId().equalsIgnoreCase(litigantId))
                            .forEach(representing -> representing.setIsActive(false)); // Use forEach to modify elements

                    mapping.setIsActive(mapping.getRepresenting().stream().anyMatch(Party::getIsActive));
                });
        producer.push(config.getUpdateRepresentativeJoinCaseTopic(), courtCase);

        updateCourtCaseInRedis(courtCase.getTenantId(), courtCase);
        log.info("operation=inactivateOldAdvocate, status=SUCCESS");
    }


    private JsonNode enrichNewAdvocateDetails(AdvocateDetails advocateDetails, ReplacementDetails
            replacementDetails) {

        // enrich advocate details of new advocate who is trying to join to enrich in addtional details
        IndividualDetails individual = advocateDetails.getIndividualDetails();
        String fullName = individual.getFirstName() + individual.getMiddleName() + individual.getLastName();
        ObjectMapper objectMapper = new ObjectMapper();
        ObjectNode newAdvocateDetail = objectMapper.createObjectNode();

        // Create advocateNameDetails object
        ObjectNode advocateNameDetails = objectMapper.createObjectNode();
        advocateNameDetails.put("name", fullName);
        advocateNameDetails.put("advocateMobileNumber", advocateDetails.getMobileNumber());
        ArrayNode advocateIdProofArray = objectMapper.createArrayNode();
        List<AdvocateIdProof> advocateIdProofDocuments = individual.getAdvocateIdProof();
        for (AdvocateIdProof advocateIdProofDocument : advocateIdProofDocuments) {
            ObjectNode advocateIdProof = objectMapper.createObjectNode();
            advocateIdProof.put("name", advocateIdProofDocument.getName());
            advocateIdProof.put("fileName", advocateIdProofDocument.getFileName());
            advocateIdProof.put("fileStore", advocateIdProofDocument.getFileStore());
            advocateIdProof.put("documentName", advocateIdProofDocument.getDocumentName());

            advocateIdProofArray.add(advocateIdProof);
        }

        advocateNameDetails.set("advocateIdProof", advocateIdProofArray);

        // Create advocateBarRegNumberWithName object
        ObjectNode advocateBarRegNumberWithName = objectMapper.createObjectNode();

        advocateBarRegNumberWithName.put("advocateName", fullName);
        advocateBarRegNumberWithName.put("advocateId", advocateDetails.getAdvocateId());
        advocateBarRegNumberWithName.put("advocateUuid", advocateDetails.getAdvocateUuid());
        // Format bar registration number
        advocateBarRegNumberWithName.put("barRegistrationNumberOriginal", advocateDetails.getBarRegistrationNumber());
        advocateBarRegNumberWithName.put("barRegistrationNumber", advocateDetails.getBarRegistrationNumber() + fullName);
        advocateBarRegNumberWithName.put("individualId", individual.getIndividualId());

        // Add both objects to newAdvocateDetail
        newAdvocateDetail.set("advocateNameDetails", advocateNameDetails);
        newAdvocateDetail.set("advocateBarRegNumberWithName", advocateBarRegNumberWithName);


        return newAdvocateDetail;
    }


    private void enrichAdditionalDetails(CourtCase courtCase, JsonNode additionalDetailsJsonNode,
                                         ReplacementDetails replacementDetails, String litigantIndividualId,
                                         String advocateUuidToReplace, JsonNode newAdvocateDetail) {

        if (!hasValidAdvocateDetails(additionalDetailsJsonNode)) {
            return;
        }

        ArrayNode formData = (ArrayNode) additionalDetailsJsonNode.get("advocateDetails").get("formdata");
        findAndProcessMatchingLitigant(formData, litigantIndividualId, advocateUuidToReplace,
                newAdvocateDetail, replacementDetails);

        courtCase.setAdditionalDetails(additionalDetailsJsonNode);
        CourtCase encrptedCourtCase = encryptionDecryptionUtil.encryptObject(courtCase, config.getCourtCaseEncrypt(), CourtCase.class);

        producer.push(config.getUpdateAdditionalJoinCaseTopic(), encrptedCourtCase);

        updateCourtCaseInRedis(courtCase.getTenantId(), encrptedCourtCase);
    }

    private boolean hasValidAdvocateDetails(JsonNode additionalDetailsJsonNode) {
        return additionalDetailsJsonNode.has("advocateDetails") &&
                additionalDetailsJsonNode.get("advocateDetails").has("formdata");
    }

    private void findAndProcessMatchingLitigant(ArrayNode formData, String litigantIndividualId,
                                                String advocateUuidToReplace, JsonNode newAdvocateDetail,
                                                ReplacementDetails replacementDetails) {
        log.info("operation=findAndProcessMatchingLitigant , status=IN_PROGRESS , formData , litigantIndividualId ,  advocateUuidToReplace , newAdvocateDetail ," +
                "replacementDetails : {}, {} , {} ,{} ,{} ", formData, litigantIndividualId, advocateUuidToReplace, newAdvocateDetail, replacementDetails);
        for (int i = 0; i < formData.size(); i++) {
            JsonNode item = formData.get(i);

            if (!hasValidMultipleAdvocatesData(item)) {
                continue;
            }

            JsonNode boxComplainant = item.get("data").get("multipleAdvocatesAndPip").get("boxComplainant");

            if (!isMatchingLitigant(boxComplainant, litigantIndividualId)) {
                continue;
            }

            // We found a matching litigant
            addVakalatnamaDocument(item, replacementDetails);
            if (!replacementDetails.getIsLitigantPip()) {
                replaceAdvocateIfFound(item, advocateUuidToReplace, newAdvocateDetail);
            } else {
                addAdvocateForPip(item, newAdvocateDetail);
            }
            log.info("operation=findAndProcessMatchingLitigant , status=SUCCESS , formData , litigantIndividualId ,  advocateUuidToReplace , newAdvocateDetail ," +
                    "replacementDetails : {}, {} , {} ,{} ,{} ", formData, litigantIndividualId, advocateUuidToReplace, newAdvocateDetail, replacementDetails);
            break; // Exit loop after processing the matching litigant
        }
    }

    private boolean hasValidMultipleAdvocatesData(JsonNode item) {
        return item.has("data") &&
                item.get("data").has("multipleAdvocatesAndPip") &&
                item.get("data").get("multipleAdvocatesAndPip").has("boxComplainant");
    }

    private boolean isMatchingLitigant(JsonNode boxComplainant, String litigantIndividualId) {
        return boxComplainant.has("individualId") &&
                !boxComplainant.get("individualId").asText().isEmpty() &&
                boxComplainant.get("individualId").textValue().equalsIgnoreCase(litigantIndividualId);
    }

    private void addVakalatnamaDocument(JsonNode item, ReplacementDetails replacementDetails) {
        JsonNode vakalatnamaFileUploadNode = item.get("data")
                .get("multipleAdvocatesAndPip")
                .get("vakalatnamaFileUpload")
                .get("document");

        // Ensure it's an `ArrayNode`, even if it's missing or null
        ArrayNode vakalatnamaFileUploadDocuments;
        if (vakalatnamaFileUploadNode != null && vakalatnamaFileUploadNode.isArray()) {
            vakalatnamaFileUploadDocuments = (ArrayNode) vakalatnamaFileUploadNode;
        } else {
            vakalatnamaFileUploadDocuments = objectMapper.createArrayNode(); // Create an empty ArrayNode
        }

        ObjectNode document = objectMapper.createObjectNode();
        if (replacementDetails.getDocument() != null) {
            Document vakalatanamaDocument = objectMapper.convertValue(replacementDetails.getDocument(), Document.class);
            document.put("fileName", UPLOAD_VAKALATNAMA);
            document.put("fileStore", vakalatanamaDocument.getFileStore());
            document.put("documentType", vakalatanamaDocument.getDocumentType());
            vakalatnamaFileUploadDocuments.add(document);
        }
    }

    private void replaceAdvocateIfFound(JsonNode item, String advocateUuidToReplace, JsonNode newAdvocateDetail) {
        JsonNode multipleAdvocatesNode = item.get("data").get("multipleAdvocatesAndPip");

        if (!multipleAdvocatesNode.has("multipleAdvocateNameDetails")) {
            return;
        }

        ArrayNode advocateNameDetailsArray = (ArrayNode) multipleAdvocatesNode.get("multipleAdvocateNameDetails");

        for (int j = 0; j < advocateNameDetailsArray.size(); j++) {
            JsonNode advocate = advocateNameDetailsArray.get(j);

            if (isMatchingAdvocate(advocate, advocateUuidToReplace)) {
                advocateNameDetailsArray.set(j, newAdvocateDetail);
                break; // Exit after replacing the first matching advocate
            }
        }
    }

    private void addAdvocateForPip(JsonNode item, JsonNode newAdvocateDetail) {
        JsonNode multipleAdvocatesNode = item.get("data").get("multipleAdvocatesAndPip");

        if (!(multipleAdvocatesNode instanceof ObjectNode objectNode)) {
            return;
        }

        // Modify "isComplainantPip" field if it exists
        if (objectNode.has("isComplainantPip") && objectNode.get("isComplainantPip").isObject()) {
            ObjectNode isComplainantPipNode = (ObjectNode) objectNode.get("isComplainantPip");
            isComplainantPipNode.put("code", "NO");
            isComplainantPipNode.put("name", "No");
        }

        // Set "pipAffidavitFileUpload" to null
        objectNode.putNull("pipAffidavitFileUpload");

        // Set "showAffidavit" to false
        objectNode.put("showAffidavit", false);

        // Set "showVakalatNamaUpload" to true, even if it was missing
        objectNode.put("showVakalatNamaUpload", true);

        // Ensure "multipleAdvocateNameDetails" exists and is an array
        ArrayNode advocateNameDetailsArray;
        if (objectNode.has("multipleAdvocateNameDetails") && objectNode.get("multipleAdvocateNameDetails").isArray()) {
            advocateNameDetailsArray = (ArrayNode) objectNode.get("multipleAdvocateNameDetails");
        } else {
            advocateNameDetailsArray = objectMapper.createArrayNode();
            objectNode.set("multipleAdvocateNameDetails", advocateNameDetailsArray);
        }

        // Add the new advocate detail
        advocateNameDetailsArray.add(newAdvocateDetail);
    }


    private boolean isMatchingAdvocate(JsonNode advocate, String advocateUuidToReplace) {
        return advocate.has("advocateBarRegNumberWithName") &&
                advocate.get("advocateBarRegNumberWithName").has("advocateUuid") &&
                advocate.get("advocateBarRegNumberWithName").get("advocateUuid").asText().equals(advocateUuidToReplace);
    }


    private AdvocateMapping enrichAdvocateDetailsInRepresentativesList(CourtCase courtCase, String
            advocateUuid, ReplacementDetails replacementDetails, Party party,
                                                                       AuditDetails auditDetails, AdvocateDetails advocateDetails, CourtCase courtCaseObj) {

        Document document = null;

        if (replacementDetails.getDocument() != null) {
            document = objectMapper.convertValue(replacementDetails.getDocument(), Document.class);
            document.setId(UUID.randomUUID().toString());
        }

        IndividualDetails individualDetails = advocateDetails.getIndividualDetails();
        List<String> nameParts = Stream.of(individualDetails.getFirstName(),
                        individualDetails.getMiddleName(),
                        individualDetails.getLastName())
                .filter(part -> part != null && !part.isEmpty())
                .toList();

        String fullName = String.join(" ", nameParts);

        ObjectNode advocateAdditionalDetails = objectMapper.createObjectNode();
        advocateAdditionalDetails.put("advocateName", fullName);
        advocateAdditionalDetails.put("uuid", advocateDetails.getAdvocateUuid());

        List<Document> documents = new ArrayList<>();
        if (document != null) {
            documents.add(document);
        }

        List<Party> partyList = new ArrayList<>();
        partyList.add(party);


        AdvocateMapping advocateMapping = AdvocateMapping.builder()
                .id(UUID.randomUUID().toString())
                .tenantId(courtCase.getTenantId())
                .advocateId(advocateUuid)
                .caseId(String.valueOf(courtCase.getId()))
                .isActive(true)
                .documents(documents)
                .representing(partyList)
                .auditDetails(auditDetails)
                .additionalDetails(advocateAdditionalDetails)
                .hasSigned(false)
                .build();

        List<AdvocateMapping> advocateMappingList = new ArrayList<>();
        advocateMappingList.add(advocateMapping);

        courtCaseObj.setRepresentatives(advocateMappingList);
        courtCase.getRepresentatives().add(advocateMapping);
        return advocateMapping;
    }

    private void updateExistingAdvocateMapping(CourtCase courtCase, String advocateUuid, Party party,
                                               List<AdvocateMapping> advocateMappings, AdvocateMapping advocateTryingToReplace,
                                               CourtCase courtCaseObj) {

        for (AdvocateMapping advocateMapping : advocateMappings) {
            if (advocateMapping.getAdvocateId().equalsIgnoreCase(advocateUuid)) {

                boolean isAdvocateAlreadyRepresenting = validateAdvocateAlreadyRepresenting(advocateTryingToReplace, party.getIndividualId());

                if (!isAdvocateAlreadyRepresenting) {

                    // Add the party to the representing list of the specific advocate mapping
                    advocateMapping.getRepresenting().add(party);

                    // Update the representatives in the original court case
                    courtCase.setRepresentatives(advocateMappings);

                    // Create a new mutable list with only the new party
                    List<Party> newPartyList = new ArrayList<>();
                    newPartyList.add(party);
                    advocateTryingToReplace.setRepresenting(newPartyList);

                    // Create a mutable list with the advocate
                    List<AdvocateMapping> singleAdvocateMappingList = new ArrayList<>();
                    singleAdvocateMappingList.add(advocateTryingToReplace);
                    courtCaseObj.setRepresentatives(singleAdvocateMappingList);

                    break;  // Exit the loop once the mapping is updated
                }
            }
        }
    }


    private void updateStatusOfAdvocate(CourtCase courtCase, String advocateUuid, PendingAdvocateRequest
            pendingAdvocateRequest) {
        log.info("operation=updateStatusOfAdvocate, status=IN_PROGRESS,courtCase advocateUuid,pendingAdvocateRequest : {}, {} ,{}", courtCase, advocateUuid,
                pendingAdvocateRequest);
        List<AdvocateMapping> advocateMappings = courtCase.getRepresentatives();
        List<PendingAdvocateRequest> pendingAdvocateRequests = courtCase.getPendingAdvocateRequests();

        boolean hasMapping = advocateMappings.stream()
                .anyMatch(mapping -> mapping.getAdvocateId().equalsIgnoreCase(advocateUuid));


        if (hasMapping && pendingAdvocateRequest.getTaskReferenceNoList().isEmpty()) {
            // remove the pending request of the advocate
            log.info("advocate has joined the case , advocateUuid : {} ", advocateUuid);
            pendingAdvocateRequests.remove(pendingAdvocateRequest);
            courtCase.setPendingAdvocateRequests(pendingAdvocateRequests);
        }

        if (hasMapping && !pendingAdvocateRequest.getTaskReferenceNoList().isEmpty()) {
            for (PendingAdvocateRequest request : pendingAdvocateRequests) {
                if (request.equals(pendingAdvocateRequest)) {
                    // advocate is partially joined as some approvals are pending and he is part of the case
                    log.info("advocate status is partially joined in the case , advocateUuid : {} ", advocateUuid);
                    request.setStatus(PARTIALLY_PENDING);
                    return;
                }
            }
        }

        if (!hasMapping && !pendingAdvocateRequest.getTaskReferenceNoList().isEmpty()) {
            for (PendingAdvocateRequest request : pendingAdvocateRequests) {
                if (pendingAdvocateRequest.equals(request)) {
                    // advocate status is pending as some approvals are pending as he has pending approvals and not part of the case
                    log.info("advocate status is pending in the case , advocateUuid : {} ", advocateUuid);
                    request.setStatus(PENDING);
                    return;
                }
            }
        }

        if (!hasMapping && pendingAdvocateRequest.getTaskReferenceNoList().isEmpty()) {
            // advocate status is reject as he is not part of the case and no approvals are left
            log.info("advocate status is rejected the case , advocateUuid : {} ", advocateUuid);
            pendingAdvocateRequests.remove(pendingAdvocateRequest);
            courtCase.setPendingAdvocateRequests(pendingAdvocateRequests);
        }
    }

    private Party enrichParty(ReplacementDetails replacementDetails, CourtCase courtCase, AuditDetails auditDetails) {

        LitigantDetails litigantDetails = replacementDetails.getLitigantDetails();
        Document document = new Document();
        List<Document> documents = new ArrayList<>();
        if (replacementDetails.getDocument() != null) {
            document.setId(UUID.randomUUID().toString());
            document.setAdditionalDetails(replacementDetails.getDocument().getAdditionalDetails());
            document.setDocumentType(replacementDetails.getDocument().getDocumentType());
            document.setFileStore(replacementDetails.getDocument().getFileStore());
            documents.add(document);
        }

        ObjectNode additionalDetails = objectMapper.createObjectNode();

        additionalDetails.put("uuid", litigantDetails.getUserUuid());
        additionalDetails.put("fullName", litigantDetails.getName());


        return Party.builder()
                .individualId(litigantDetails.getIndividualId())
                .partyType(litigantDetails.getPartyType())
                .tenantId(courtCase.getTenantId())
                .isActive(true)
                .documents(documents)
                .auditDetails(auditDetails)
                .additionalDetails(additionalDetails)
                .caseId(courtCase.getId().toString())
                .id(UUID.randomUUID())
                .build();
    }

    private AuditDetails enrichAuditDetails(RequestInfo requestInfo) {
        return AuditDetails.builder()
                .createdTime(System.currentTimeMillis())
                .createdBy(requestInfo.getUserInfo().getUuid())
                .lastModifiedTime(System.currentTimeMillis())
                .lastModifiedBy(requestInfo.getUserInfo().getUuid())
                .build();
    }

    private AdvocateDetails enrichAdvocateDetailsInJoinCaseTaskRequest(IndividualDetails
                                                                               individualDetails, Advocate joinCaseAdvocate, Individual individual,
                                                                       JoinCaseDataV2 joinCaseData) {
        return AdvocateDetails.builder()
                .barRegistrationNumber(joinCaseAdvocate.getBarRegistrationNumber())
                .advocateId(joinCaseData.getRepresentative().getAdvocateId())
                .advocateUuid(individual.getUserUuid())
                .mobileNumber(individual.getMobileNumber())
                .requestedDate(System.currentTimeMillis())
                .individualDetails(individualDetails)
                .build();
    }

    private IndividualDetails enrichIndividualDetailsInJoinCaseTaskRequest(Individual individual) throws
            JsonProcessingException {
        Identifier identifier = individual.getIdentifiers().get(0);
        AdditionalFields additionalFields = individual.getAdditionalFields();

        List<Field> fields = additionalFields.getFields();
        ObjectMapper objectMapper = new ObjectMapper();

        String fileStoreId = null;
        String filename = null;

        for (Field field : fields) {
            if ("identifierIdDetails".equals(field.getKey())) {
                JsonNode jsonNode = objectMapper.readTree(field.getValue());
                fileStoreId = jsonNode.has("fileStoreId") ? jsonNode.get("fileStoreId").asText() : null;
                filename = jsonNode.has("filename") ? jsonNode.get("filename").asText() : null;
                break;
            }
        }

        AdvocateIdProof advocateIdProof = AdvocateIdProof.builder()
                .fileStore(fileStoreId)
                .name(identifier.getIdentifierType())
                .fileName(identifier.getIdentifierType() + " Card")
                .documentName(filename)
                .build();

        return IndividualDetails.builder()
                .firstName(individual.getName().getGivenName())
                .lastName(individual.getName().getFamilyName())
                .middleName(individual.getName().getOtherNames())
                .individualId(individual.getIndividualId())
                .advocateIdProof(List.of(advocateIdProof))
                .build();
    }

    private EvidenceRequest enrichEvidenceCreateRequest(CourtCase courtCase, ReplacementDetails
            replacementDetails, RequestInfo requestInfo) {

        Document document = objectMapper.convertValue(replacementDetails.getDocument(), Document.class);
        org.egov.common.contract.models.Document workflowDocument = objectMapper.convertValue(document, org.egov.common.contract.models.Document.class);

        LitigantDetails litigantDetails = replacementDetails.getLitigantDetails();
        String sourceType = litigantDetails.getPartyType().contains("complainant") ? "COMPLAINANT" : "ACCUSED";

        WorkflowObject workflowObject = new WorkflowObject();
        workflowObject.setAction("TYPE DEPOSITION");
        workflowObject.setDocuments(Collections.singletonList(workflowDocument));

        return EvidenceRequest.builder().requestInfo(requestInfo)
                .artifact(Artifact.builder()
                        .artifactType(VAKALATNAMA_DOC)
                        .sourceType(sourceType)
                        .sourceID(litigantDetails.getIndividualId())
                        .filingType("CASE_FILING")
                        .filingNumber(courtCase.getFilingNumber())
                        .comments(new ArrayList<>())
                        .isEvidence(false)
                        .caseId(courtCase.getId().toString())
                        .tenantId(courtCase.getTenantId())
                        .file(document)
                        .workflow(workflowObject)
                        .build()).build();
    }

    private EvidenceRequest enrichEvidenceCreateRequestForReasonDocument(CourtCase courtCase, JoinCaseTaskRequest
            joinCaseTaskRequest, RequestInfo requestInfo) {

        ReasonDocument reasonDocument = joinCaseTaskRequest.getReasonDocument();

        String sourceType = (joinCaseTaskRequest.getReplacementDetails().isEmpty()
                ? null
                : (joinCaseTaskRequest.getReplacementDetails().get(0).getLitigantDetails().getPartyType().contains("complainant")
                ? COMPLAINANT
                : ACCUSED));

        Document document = Document.builder()
                .fileStore(reasonDocument.getFileStore())
                .build();
        org.egov.common.contract.models.Document workflowDocument = objectMapper.convertValue(document, org.egov.common.contract.models.Document.class);

        return EvidenceRequest.builder().requestInfo(requestInfo)
                .artifact(Artifact.builder()
                        .artifactType(REASON_DOCUMENT)
                        .filingType(DIRECT)
                        .filingNumber(courtCase.getFilingNumber())
                        .sourceType(sourceType)
                        .comments(new ArrayList<>())
                        .isEvidence(false)
                        .isVoid(false)
                        .status(SUBMITTED)
                        .caseId(courtCase.getId().toString())
                        .tenantId(courtCase.getTenantId())
                        .file(document)
                        .build()).build();
    }


    private void enrichHearingDetails(CourtCase courtCase, ReplacementDetails
            replacementDetails, JoinCaseTaskRequest joinCaseTaskRequest, RequestInfo requestInfo) {

        AdvocateDetails advocateTryingToJoinCase = joinCaseTaskRequest.getAdvocateDetails();

        IndividualDetails individualTryingToReplace = advocateTryingToJoinCase.getIndividualDetails();

        ReplacementAdvocateDetails replacementAdvocateDetails;

        if (replacementDetails.getAdvocateDetails() != null) {
            replacementAdvocateDetails = replacementDetails.getAdvocateDetails();
        } else {
            replacementAdvocateDetails = null;
        }

        List<String> nameParts = Stream.of(individualTryingToReplace.getFirstName(),
                        individualTryingToReplace.getMiddleName(),
                        individualTryingToReplace.getLastName())
                .filter(part -> part != null && !part.isEmpty())
                .toList();

        String fullName = String.join(" ", nameParts);

        HearingCriteria hearingCriteria = HearingCriteria.builder()
                .filingNumber(courtCase.getFilingNumber())
                .build();

        List<Hearing> hearings = getHearingsForCase(hearingCriteria);

        List<Hearing> scheduledHearings = hearings.stream().filter(hearing -> hearing.getStatus().equalsIgnoreCase("SCHEDULED")).toList();

        for (Hearing hearing : scheduledHearings) {
            // add new advocate to the hearing who is joining the case
            Attendee newAttendee = new Attendee();
            newAttendee.setIndividualId(individualTryingToReplace.getIndividualId());
            newAttendee.setName(fullName);
            newAttendee.setType("Advocate");
            Optional.ofNullable(hearing.getAttendees()).orElse(new ArrayList<>()).add(newAttendee);
            HearingRequest hearingRequest = new HearingRequest();
            requestInfo.getUserInfo().getRoles().add(Role.builder().code("HEARING_SCHEDULER").name("HEARING_SCHEDULER").tenantId(courtCase.getTenantId()).build());
            hearingRequest.setRequestInfo(requestInfo);
            hearingRequest.setHearing(hearing);

            // remove the old advocate from the hearing if he is no more part of the case
            List<Attendee> attendees = hearing.getAttendees();

            if (replacementAdvocateDetails != null && replacementAdvocateDetails.getAdvocateUuid() != null) {
                boolean isAdvocatePartOfCase = courtCase.getRepresentatives().stream()
                        .filter(mapping -> mapping.getAdvocateId().equalsIgnoreCase(replacementAdvocateDetails.getAdvocateUuid()))
                        .findFirst().isEmpty();

                String individualIdOfAdvocate = advocateUtil.getAdvocate(requestInfo, List.of(replacementAdvocateDetails.getAdvocateUuid())).stream().findFirst().orElse(null);

                boolean isAccusedAdvocate = !replacementDetails.getLitigantDetails().getPartyType().contains("complainant");

                List<String> namesToBeRemoved= new ArrayList<>();
                if (!isAdvocatePartOfCase) {
                    for (int i = 0; i < attendees.size(); i++) {
                        if ((attendees.get(i).getIndividualId() != null) && attendees.get(i).getIndividualId().equals(individualIdOfAdvocate)) {
                            namesToBeRemoved.add(attendees.get(i).getName());
                            attendees.remove(i);
                            break;
                        }
                    }
                }
                //update open hearing index
                updateHearingIndexForReplaceAdvocate(fullName,individualTryingToReplace.getIndividualId(),isAccusedAdvocate,hearing,courtCase.getCourtId(),namesToBeRemoved);
            }


            hearingUtil.updateTranscriptAdditionalAttendees(hearingRequest);

        }
    }

    public Map<String, AtomicBoolean> enrichAccessCode(AccessCodeGenerateRequest accessCodeGenerateRequest) {
        Map<String, AtomicBoolean> responseMap = new HashMap<>();
        for (String filingNumber : accessCodeGenerateRequest.getFilingNumberList()) {
            AtomicBoolean generated = new AtomicBoolean(false);

            List<CaseCriteria> casesList = caseRepository.getCases(Collections.singletonList(CaseCriteria.builder().filingNumber(filingNumber).build()), accessCodeGenerateRequest.getRequestInfo());
            casesList.forEach(caseCriteria -> {
                caseCriteria.getResponseList().forEach(cases -> {
                    if (cases.getAccessCode() == null || cases.getAccessCode().isEmpty()) {
                        CourtCase decryptedCourtCase = encryptionDecryptionUtil.decryptObject(cases, config.getCaseDecryptSelf(), CourtCase.class, accessCodeGenerateRequest.getRequestInfo());
                        CaseRequest caseRequest = CaseRequest.builder().cases(decryptedCourtCase).requestInfo(accessCodeGenerateRequest.getRequestInfo()).build();

                        enrichmentUtil.enrichAccessCode(caseRequest);
                        log.info("In enrich access code if null for caseId :: {}, access-code :: {}", caseRequest.getCases().getId(), caseRequest.getCases().getAccessCode());

                        caseRequest.setCases(encryptionDecryptionUtil.encryptObject(caseRequest.getCases(), config.getCourtCaseEncrypt(), CourtCase.class));

                        producer.push(config.getCaseUpdateStatusTopic(), caseRequest);
                        cacheService.save(accessCodeGenerateRequest.getRequestInfo().getUserInfo().getTenantId() + ":" + cases.getId().toString(), caseRequest.getCases());
                        generated.set(true);
                    }
                });
            });

            responseMap.put(filingNumber, generated);
        }

        return responseMap;
    }

    public Calculation compareCalculationAndCreateDemand(@Valid CaseRequest body) {
        try {
            log.info("operation=compareCalculationAndCreateDemand, status=IN_PROGRESS, caseId: {}", body.getCases().getId());
            CalculationRes newCalculation = getCalculation(body.getCases(), body.getRequestInfo());

            String lastSubmissionConsumerCode = getLastSubmissionConsumerCode(body) != null ? getLastSubmissionConsumerCode(body) : body.getCases().getFilingNumber() + "_CASE_FILING";
            Calculation oldCalculation = etreasuryUtil.getHeadBreakupCalculation(lastSubmissionConsumerCode, body.getRequestInfo());

            if (oldCalculation == null) {
                log.info("No previous calculation found for caseId: {}, for creating new demand", body.getCases().getId());
                return null;
            }
            Calculation calculation = getCalculationDifference(newCalculation, oldCalculation);

            if (calculation != null) {
                createDemandForCase(body, calculation, newCalculation.getCalculation().get(0), lastSubmissionConsumerCode);
            }
            log.info("operation=compareCalculationAndCreateDemand, status=SUCCESS, caseId: {}", body.getCases().getId());
            return calculation;
        } catch (Exception e) {
            log.error("operation=compareCalculationAndCreateDemand, status=ERROR, caseId: {}, error: {}", body.getCases().getId(), e.getMessage());
            throw new CustomException("ERROR_CALCULATION_CASE", "Error while resubmitting case with id: " + body.getCases().getId() + ", error: " + e.getMessage());
        }
    }

    private CalculationRes getCalculation(CourtCase courtCase, RequestInfo requestInfo) {
        EFillingCalculationCriteria calculationCriteria = EFillingCalculationCriteria.builder()
                .tenantId(courtCase.getTenantId())
                .caseId(courtCase.getId().toString())
                .filingNumber(courtCase.getFilingNumber())
                .build();

        calculationCriteria.setCheckAmount(getChequeAmount(courtCase));
        calculationCriteria.setIsDelayCondonation(isDelayCondonation(courtCase));

        EFillingCalculationRequest calculationRequest = EFillingCalculationRequest.builder()
                .requestInfo(requestInfo)
                .calculationCriteria(Collections.singletonList(calculationCriteria))
                .build();

        return paymentCalculaterUtil.callPaymentCalculator(calculationRequest);
    }


    private Calculation getCalculationDifference(CalculationRes newCalculation, Calculation oldCalculation) {
        Calculation newCalc = newCalculation.getCalculation().get(0);

        List<BreakDown> newBreakDowns = newCalc.getBreakDown();
        List<BreakDown> oldBreakDowns = oldCalculation.getBreakDown();

        Map<String, BreakDown> oldBreakDownMap = oldBreakDowns.stream()
                .collect(Collectors.toMap(BreakDown::getCode, Function.identity()));
        List<BreakDown> differenceBreakDowns = new ArrayList<>();

        double diffTotalAmount = 0.0;
        for (BreakDown newBreakDown : newBreakDowns) {
            BreakDown oldBreakDown = oldBreakDownMap.get(newBreakDown.getCode());

            if (oldBreakDown == null) {
                // Entire new amount is considered difference
                diffTotalAmount += newBreakDown.getAmount();

                BreakDown differenceItem = new BreakDown();
                differenceItem.setCode(newBreakDown.getCode());
                differenceItem.setType(newBreakDown.getType());
                differenceItem.setAmount(newBreakDown.getAmount());
                differenceBreakDowns.add(differenceItem);
            } else if (newBreakDown.getAmount() > oldBreakDown.getAmount()) {
                // Only the increased amount is considered difference
                double diff = newBreakDown.getAmount() - oldBreakDown.getAmount();
                diffTotalAmount += diff;

                BreakDown differenceItem = new BreakDown();
                differenceItem.setCode(newBreakDown.getCode());
                differenceItem.setType(newBreakDown.getType());
                differenceItem.setAmount(diff);
                differenceBreakDowns.add(differenceItem);
            }
        }

        if (!differenceBreakDowns.isEmpty()) {
            Calculation difference = new Calculation();
            difference.setTenantId(newCalc.getTenantId());
            difference.setTotalAmount(diffTotalAmount);
            difference.setBreakDown(differenceBreakDowns);
            return difference;
        }
        return null;
    }

    private void createDemandForCase(@Valid CaseRequest body, Calculation calculation, Calculation
            finalCalculation, String lastSubmissionConsumerCode) {
        try {
            DemandCreateRequest demandCreateRequest = DemandCreateRequest.builder()
                    .requestInfo(body.getRequestInfo())
                    .filingNumber(body.getCases().getFilingNumber())
                    .consumerCode(updateAndGetConsumerCode(body))
                    .tenantId(body.getCases().getTenantId())
                    .entityType(config.getCaseBusinessServiceName())
                    .calculation(Collections.singletonList(calculation))
                    .finalCalcPostResubmission(finalCalculation)
                    .lastSubmissionConsumerCode(lastSubmissionConsumerCode)
                    .build();

            etreasuryUtil.createDemand(demandCreateRequest);
        } catch (Exception e) {
            log.error("Error while creating demand for caseId: {}, error: {}", body.getCases().getId(), e.getMessage());
            throw new CustomException("ERROR_CREATING_DEMAND", "Error while creating demand for caseId: " + body.getCases().getId() + ", error: " + e.getMessage());
        }
    }

    private String getLastSubmissionConsumerCode(CaseRequest body) {
        JsonNode additionalDetails = objectMapper.convertValue(body.getCases().getAdditionalDetails(), JsonNode.class);

        if (additionalDetails != null && additionalDetails.has("lastSubmissionConsumerCode")) {
            return additionalDetails.get("lastSubmissionConsumerCode").textValue();
        }
        return null;
    }

    private String updateAndGetConsumerCode(CaseRequest body) {
        JsonNode additionalDetails = objectMapper.convertValue(body.getCases().getAdditionalDetails(), JsonNode.class);
        String baseConsumerCode = body.getCases().getFilingNumber() + "_CASE_FILING";

        String newConsumerCode;
        int nextSuffix = 1;

        if (additionalDetails != null && additionalDetails.has("lastSubmissionConsumerCode")) {
            String lastConsumerCode = getLastSubmissionConsumerCode(body);
            if (lastConsumerCode != null && lastConsumerCode.startsWith(baseConsumerCode)) {
                nextSuffix = getNextSuffix(lastConsumerCode, baseConsumerCode);
            }
        }
        newConsumerCode = baseConsumerCode + "-" + nextSuffix;
        ((ObjectNode) additionalDetails).put("lastSubmissionConsumerCode", newConsumerCode);

        body.getCases().setAdditionalDetails(objectMapper.convertValue(additionalDetails, Map.class));
        return newConsumerCode;
    }


    private static int getNextSuffix(String lastConsumerCode, String baseConsumerCode) {
        String suffixPart = lastConsumerCode.substring(baseConsumerCode.length());

        int nextSuffix = 1; // Default if no suffix found

        if (suffixPart.startsWith("-")) {
            try {
                int currentSuffix = Integer.parseInt(suffixPart.substring(1));
                nextSuffix = currentSuffix + 1;
            } catch (NumberFormatException e) {
                // If suffix is not a valid number, reset to 1
                nextSuffix = 1;
            }
        }
        return nextSuffix;
    }


    private Boolean isDelayCondonation(CourtCase existingCase) {
        JsonNode caseDetails = objectMapper.convertValue(existingCase.getCaseDetails(), JsonNode.class);
        if (caseDetails == null || caseDetails.get("delayApplications") == null) {
            return false;
        }

        JsonNode delayFormData = caseDetails.get("delayApplications").get("formdata").get(0);
        if (delayFormData == null || delayFormData.get("data") == null) {
            return false;
        }

        JsonNode data = delayFormData.get("data");
        JsonNode delayType = data.get("delayCondonationType");
        JsonNode condonationFiles = data.get("condonationFileUpload");

        boolean isCodeNo = delayType != null
                && "NO".equals(delayType.get("code").asText());

        boolean hasFile = condonationFiles != null
                && condonationFiles.has("document")
                && condonationFiles.get("document").isArray()
                && !condonationFiles.get("document").isEmpty()
                && condonationFiles.get("document").get(0).hasNonNull("fileStore");

        return isCodeNo && hasFile;
    }

    private Double getChequeAmount(CourtCase courtCase) {
        JsonNode caseDetails = objectMapper.convertValue(courtCase.getCaseDetails(), JsonNode.class);
        JsonNode chequeDetails = (caseDetails != null) ? caseDetails.get("chequeDetails") : null;

        if (chequeDetails == null || chequeDetails.get("formdata") == null || !chequeDetails.get("formdata").isArray()) {
            return 0.0;
        }
        return sumChequeAmounts(chequeDetails.get("formdata"), courtCase.getId().toString());
    }

    private double sumChequeAmounts(JsonNode formdata, String caseId) {
        double totalAmount = 0.0;

        for (JsonNode formNode : formdata) {
            JsonNode amountNode = formNode.path("data").path("chequeAmount");

            if (amountNode.isTextual()) {
                try {
                    totalAmount += Double.parseDouble(amountNode.asText());
                } catch (NumberFormatException e) {
                    log.error("Error parsing chequeAmount for caseId: {}, error: {}", caseId, e.getMessage());
                }
            }
        }

        return totalAmount;
    }

    public Integer getCaseCount(CaseSearchRequest caseSearchRequest) {
        return caseRepository.getCaseCount(caseSearchRequest);
    }

    public WitnessDetailsResponse addWitnessToCase(@Valid WitnessDetailsRequest body) {
        try {
            log.info("operation=addWitnessToCase, status=IN_PROGRESS, filingNumber: {}", body.getCaseFilingNumber());
            CaseCriteria caseCriteria = CaseCriteria.builder()
                    .filingNumber(body.getCaseFilingNumber())
                    .defaultFields(false)
                    .build();
            List<CaseCriteria> courtCaseList = caseRepository.getCases(Collections.singletonList(caseCriteria), body.getRequestInfo());
            if (courtCaseList.isEmpty() || courtCaseList.get(0).getResponseList().isEmpty()) {
                throw new CustomException(INVALID_CASE, "No case found for filing number " + body.getCaseFilingNumber());
            }
            CourtCase courtCase = encryptionDecryptionUtil.decryptObject(courtCaseList.get(0).getResponseList().get(0), config.getCaseDecryptSelf(), CourtCase.class, body.getRequestInfo());
            validator.validateWitnessRequest(body, courtCase);
            updateWitnessDetailsInCase(body.getWitnessDetails(), courtCase);
            enrichmentUtil.enrichStatuteAndSectionsOnCreateAndUpdate(courtCase, courtCase.getAuditdetails());
            CourtCase caseObj = encryptionDecryptionUtil.encryptObject(courtCase, config.getCourtCaseEncrypt(), CourtCase.class);
            updateCourtCaseInRedis(body.getTenantId(), caseObj);
            producer.push(config.getCaseUpdateTopic(), CaseRequest.builder().requestInfo(body.getRequestInfo()).cases(caseObj).build());
            log.info("operation=addWitnessToCase, status=SUCCESS, filingNumber: {}", body.getCaseFilingNumber());
            return WitnessDetailsResponse.builder().witnessDetails(body.getWitnessDetails()).build();
        } catch (Exception e) {
            log.error("operation=addWitnessToCase, status=FAILURE, filingNumber: {}, error: {}", body.getCaseFilingNumber(), e.getMessage());
            throw new CustomException(ERROR_ADDING_WITNESS, "Error while adding witness to case: " + body.getCaseFilingNumber() + ", error: " + e.getMessage());
        }
    }

    private void updateWitnessDetailsInCase(List<WitnessDetails> witnessDetails, CourtCase courtCase) {
        Map<String, WitnessDetails> mergedMap = new LinkedHashMap<>(); // preserves order
        List<WitnessDetails> existing = Optional.ofNullable(courtCase.getWitnessDetails()).orElse(Collections.emptyList());
        List<WitnessDetails> updates = Optional.ofNullable(witnessDetails).orElse(Collections.emptyList());
        if (updates.stream().anyMatch(w -> w == null || w.getUniqueId() == null)) {
            throw new CustomException(VALIDATION_ERR, "Each witnessDetails item must have non-null uniqueId");
        }
        for (WitnessDetails w : existing) {
            if (w != null && w.getUniqueId() != null) {
                mergedMap.put(w.getUniqueId(), w);
            }
        }

        for (WitnessDetails w : updates) {
            if (w != null && w.getUniqueId() != null) {
                mergedMap.put(w.getUniqueId(), w);  // replaces the element if uniqueId already exists
            }
        }

        courtCase.setWitnessDetails(new ArrayList<>(mergedMap.values()));
    }

    @Deprecated
    private void updateCaseAdditionalDetails(List<WitnessDetails> updatedWitnessDetails, CourtCase courtCase) {
        if (updatedWitnessDetails == null || courtCase == null) {
            log.warn("WitnessDetails or CourtCase is null, skipping enrichment.");
            return;
        }
        ObjectNode additionalDetailsNode = objectMapper.convertValue(courtCase.getAdditionalDetails(), ObjectNode.class);

        ObjectNode witnessDetailsNode = additionalDetailsNode.withObject("/witnessDetails");

        ArrayNode formdataArray = (ArrayNode) witnessDetailsNode.get("formdata");
        if (formdataArray == null || !formdataArray.isArray()) {
            formdataArray = objectMapper.createArrayNode();
            witnessDetailsNode.set("formdata", formdataArray);
        }

        for (WitnessDetails witnessDetails : updatedWitnessDetails) {
            String uniqueId = witnessDetails.getUniqueId();
            boolean found = false;

            // Check if uniqueId already exists in the formdata array
            for (int i = 0; i < formdataArray.size(); i++) {
                JsonNode existingNode = formdataArray.get(i);
                if (existingNode.has("uniqueId") &&
                        uniqueId != null &&
                        uniqueId.equals(existingNode.get("uniqueId").asText())) {

                    JsonNode data = existingNode.get("data");
                    WitnessDetails existingWitness = objectMapper.convertValue(data, WitnessDetails.class);
                    updateWitnessDetails(existingWitness, witnessDetails);
                    ObjectNode existingObjectNode = (ObjectNode) existingNode;
                    JsonNode updatedDataNode = objectMapper.convertValue(existingWitness, JsonNode.class);
                    existingObjectNode.set("data", updatedDataNode);
                    found = true;
                    log.debug("Updated existing witness record with uniqueId: {}", uniqueId);
                    break;
                }
            }

            // If uniqueId not found, add new record
            if (!found) {
                JsonNode dataNode = objectMapper.convertValue(witnessDetails, JsonNode.class);
                ObjectNode dataWrapperNode = objectMapper.createObjectNode();
                dataWrapperNode.set("data", dataNode);
                dataWrapperNode.put("uniqueId", uniqueId);
                dataWrapperNode.put("isenabled", true);
                dataWrapperNode.put("displayindex", 0);
                formdataArray.add(dataWrapperNode);
                log.debug("Added new witness record with uniqueId: {}", uniqueId);
            }
        }
        courtCase.setAdditionalDetails(additionalDetailsNode);
    }

    private void updateWitnessDetails(WitnessDetails existingWitness, WitnessDetails witnessDetails) {
        if (witnessDetails == null) {
            return;
        }

        // Update phone numbers
        if (witnessDetails.getPhoneNumbers() != null &&
                witnessDetails.getPhoneNumbers().getMobileNumber() != null &&
                !witnessDetails.getPhoneNumbers().getMobileNumber().isEmpty()) {

            if (existingWitness.getPhoneNumbers() == null) {
                existingWitness.setPhoneNumbers(new PhoneNumbers()); // assuming PhoneNumbers is the class
            }
            if (existingWitness.getPhoneNumbers().getMobileNumber() == null) {
                existingWitness.getPhoneNumbers().setMobileNumber(new ArrayList<>());
            }
            existingWitness.getPhoneNumbers().getMobileNumber()
                    .addAll(witnessDetails.getPhoneNumbers().getMobileNumber());
        }

        // Update emails
        if (witnessDetails.getEmails() != null &&
                witnessDetails.getEmails().getEmailId() != null &&
                !witnessDetails.getEmails().getEmailId().isEmpty()) {

            if (existingWitness.getEmails() == null) {
                existingWitness.setEmails(new Emails());
            }
            if (existingWitness.getEmails().getEmailId() == null) {
                existingWitness.getEmails().setEmailId(new ArrayList<>());
            }
            existingWitness.getEmails().getEmailId()
                    .addAll(witnessDetails.getEmails().getEmailId());
        }

        // Update address details
        if (witnessDetails.getAddressDetails() != null &&
                !witnessDetails.getAddressDetails().isEmpty()) {

            if (existingWitness.getAddressDetails() == null) {
                existingWitness.setAddressDetails(new ArrayList<>());
            }
            existingWitness.getAddressDetails().addAll(witnessDetails.getAddressDetails());
        }

        // Update simple string fields
        if (witnessDetails.getFirstName() != null && !witnessDetails.getFirstName().trim().isEmpty()) {
            existingWitness.setFirstName(witnessDetails.getFirstName());
        }
        if (witnessDetails.getLastName() != null && !witnessDetails.getLastName().trim().isEmpty()) {
            existingWitness.setLastName(witnessDetails.getLastName());
        }
        if (witnessDetails.getMiddleName() != null && !witnessDetails.getMiddleName().trim().isEmpty()) {
            existingWitness.setMiddleName(witnessDetails.getMiddleName());
        }
        if (witnessDetails.getWitnessDesignation() != null && !witnessDetails.getWitnessDesignation().trim().isEmpty()) {
            existingWitness.setWitnessDesignation(witnessDetails.getWitnessDesignation());
        }
        if (witnessDetails.getWitnessAge() != null && !witnessDetails.getWitnessAge().trim().isEmpty()) {
            existingWitness.setWitnessAge(witnessDetails.getWitnessAge());
        }
        if (witnessDetails.getAdditionalDetails() != null) {
            existingWitness.setAdditionalDetails(witnessDetails.getAdditionalDetails());
        }
        if (witnessDetails.getDateOfService() != null && !witnessDetails.getDateOfService().trim().isEmpty()) {
            existingWitness.setDateOfService(witnessDetails.getDateOfService());
        }
        if (witnessDetails.getWitnessTag() != null && !witnessDetails.getWitnessTag().trim().isEmpty()) {
            existingWitness.setWitnessTag(witnessDetails.getWitnessTag());
        }
        if (witnessDetails.getOwnerType() != null && !witnessDetails.getOwnerType().trim().isEmpty()) {
            existingWitness.setOwnerType(witnessDetails.getOwnerType());
        }
    }



    /**
     * Updates a case without triggering workflow processes.
     * Performs validation on the case object and handles errors appropriately.
     *
     * @param body The CaseRequest containing case details to update
     * @return CourtCase The updated court case
     * @throws CustomException if validation fails or update operation encounters errors
     */
    public CourtCase updateCaseWithoutWorkflow(@Valid CaseRequest body) {
        try {
            // Validate case object
            CourtCase courtCase = body.getCases();
            if (courtCase == null) {
                log.error("Method=updateCaseWithoutWorkflow,Result=FAILURE, Error=CourtCase is null");
                throw new CustomException(UPDATE_CASE_WITHOUT_WORKFLOW_ERR, "CourtCase cannot be null");
            }
            log.info("Method=updateCaseWithoutWorkflow,Result=IN_PROGRESS, caseId={}, tenantId={}", body.getCases().getId(), body.getCases().getTenantId());
            // Validate required fields
            if (StringUtils.isBlank(courtCase.getTenantId())) {
                log.error("Method=updateCaseWithoutWorkflow,Result=FAILURE, Error=TenantId is null or empty, CaseId={}", courtCase.getId());
                throw new CustomException(UPDATE_CASE_WITHOUT_WORKFLOW_ERR, "TenantId cannot be null or empty");
            }

            if (courtCase.getId() == null) {
                log.error("Method=updateCaseWithoutWorkflow,Result=FAILURE, Error=CaseId is null or empty");
                throw new CustomException(UPDATE_CASE_WITHOUT_WORKFLOW_ERR, "Case ID cannot be null or empty");
            }
            enrichmentUtil.enrichStatuteAndSectionsOnCreateAndUpdate(body.getCases(), body.getCases().getAuditdetails());
            // Encrypt the case object
            CourtCase encryptedCourtCase = encryptionDecryptionUtil.encryptObject(body.getCases(), config.getCourtCaseEncrypt(), CourtCase.class);
            if (encryptedCourtCase == null) {
                log.error("Method=updateCaseWithoutWorkflow,Result=FAILURE, Error=Encryption failed, CaseId={}", courtCase.getId());
                throw new CustomException(UPDATE_CASE_WITHOUT_WORKFLOW_ERR, "Failed to encrypt case object");
            }

            // Update case in Redis cache
            updateCourtCaseInRedis(courtCase.getTenantId(), encryptedCourtCase);
            CaseRequest caseRequest = CaseRequest.builder()
                    .requestInfo(body.getRequestInfo())
                    .cases(encryptedCourtCase)
                    .build();
            producer.push(config.getCaseUpdateTopic(), caseRequest);
            log.info("Method=updateCaseWithoutWorkflow,Result=SUCCESS, CaseId={}, TenantId={}",
                    courtCase.getId(), courtCase.getTenantId());

            return courtCase;

        } catch (CustomException e) {
            log.error("Method=updateCaseWithoutWorkflow,Result=FAILURE, Error=Unexpected exception occurred, Message={}",
                    e.getMessage(), e);
            throw new CustomException(UPDATE_CASE_WITHOUT_WORKFLOW_ERR,
                    "An unexpected error occurred while updating case without workflow: " + e.getMessage());
        }
    }

    public CourtCase updateLPRDetails(CaseRequest caseRequest) {
        try {

            CourtCase courtCase = caseRequest.getCases();

            log.info("Method=updateLPRDetails,Result=IN_PROGRESS, caseId={}, tenantId={}", courtCase.getId(), courtCase.getTenantId());

            validator.validateUpdateLPRDetails(caseRequest);

            if (courtCase.getIsLPRCase()) {
                // moving the case into LPR
                enrichmentUtil.enrichLPRNumber(caseRequest);
            } else {
                // moving the case out of LPR
                String courtCaseNumber = courtCase.getCourtCaseNumber();
                enrichmentUtil.enrichCourtCaseNumber(caseRequest);
                courtCase.setCourtCaseNumberBackup(courtCaseNumber);
            }
            updateCaseConversion(caseRequest);
            producer.push(config.getLprCaseDetailsUpdateTopic(), caseRequest);
            caseRequest.setCases(encryptionDecryptionUtil.encryptObject(caseRequest.getCases(), config.getCourtCaseEncrypt(), CourtCase.class));
            cacheService.save(caseRequest.getCases().getTenantId() + ":" + caseRequest.getCases().getId(), caseRequest.getCases());

            log.info("Method=updateLPRDetails,Result=SUCCESS, CaseId={}, TenantId={}", courtCase.getId(), courtCase.getTenantId());
            return courtCase;

        } catch (CustomException e) {
            log.error("Method=updateLPRDetails,Result=FAILURE, Error=Unexpected exception occurred, Message={}",
                    e.getMessage(), e);
            throw new CustomException(UPDATE_LPR_CASE_ERR,
                    "An unexpected error occurred while updating LPR details : " + e.getMessage());
        }
    }

    public List<PartyAddressRequest> addAddress(AddAddressRequest addAddressRequest) {

        try {
                CourtCase courtCase;
                List<CaseCriteria> existingApplications = caseRepository.getCases(Collections.singletonList(CaseCriteria.builder().filingNumber(addAddressRequest.getFilingNumber()).build()), addAddressRequest.getRequestInfo());

                if (existingApplications.get(0).getResponseList().isEmpty()) {
                    log.debug("CourtCase not found in DB for filingNumber :: {}", addAddressRequest.getFilingNumber());
                    throw new CustomException(VALIDATION_ERR, "Case Application does not exist");
                } else {
                    courtCase = existingApplications.get(0).getResponseList().get(0);
                }

            CourtCase decryptedCourtCase = encryptionDecryptionUtil.decryptObject(courtCase, config.getCaseDecryptSelf(), CourtCase.class, addAddressRequest.getRequestInfo());

            AuditDetails auditDetails = courtCase.getAuditdetails();
            auditDetails.setLastModifiedTime(System.currentTimeMillis());
            auditDetails.setLastModifiedBy(addAddressRequest.getRequestInfo().getUserInfo().getUuid());

            enrichAdditionalDetailsForAddress(addAddressRequest, decryptedCourtCase);
            decryptedCourtCase.setAuditdetails(auditDetails);

            CaseRequest caseRequest = new CaseRequest();
            caseRequest.setRequestInfo(addAddressRequest.getRequestInfo());
            caseRequest.setCases(decryptedCourtCase);

            log.info("Encrypting :: {}", caseRequest);

            caseRequest.setCases(encryptionDecryptionUtil.encryptObject(caseRequest.getCases(), config.getCourtCaseEncryptNew(), CourtCase.class));
            cacheService.save(caseRequest.getCases().getTenantId() + ":" + caseRequest.getCases().getId(), caseRequest.getCases());

            producer.push(config.getAddAddressTopic(), caseRequest);

            CourtCase cases = encryptionDecryptionUtil.decryptObject(caseRequest.getCases(), null, CourtCase.class, caseRequest.getRequestInfo());
            cases.setAccessCode(null);

            return addAddressRequest.getPartyAddresses();

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while adding address :: {}", e.toString());
            throw new CustomException(EDIT_CASE_ERR, "Exception occurred while adding address : " + e.getMessage());
        }

    }

    private void enrichAdditionalDetailsForAddress(AddAddressRequest addAddressRequest, CourtCase courtCase) {
        try {
            ObjectNode additionalDetails = objectMapper.valueToTree(courtCase.getAdditionalDetails());

            for (PartyAddressRequest party : addAddressRequest.getPartyAddresses()) {
                String partyType = party.getPartyType();
                UUID uniqueId = party.getUniqueId();

                if (partyType == null || uniqueId == null) continue;
                if("ACCUSED".equalsIgnoreCase(partyType)){

                    ObjectNode section = (ObjectNode) additionalDetails.get("respondentDetails");
                    if (section == null || section.get("formdata") == null) continue;

                    ArrayNode formDataArray = (ArrayNode) section.get("formdata");

                    for (JsonNode formData : formDataArray) {
                        if (formData.has("uniqueId") &&
                                formData.get("uniqueId").asText().equalsIgnoreCase(uniqueId.toString())) {

                            ObjectNode dataNode = (ObjectNode) formData.get("data");
                            if (dataNode == null) continue;

                            // Get or create "addressDetails" array
                            ArrayNode addressDetailsArray;
                            if (dataNode.has("addressDetails") && dataNode.get("addressDetails").isArray()) {
                                addressDetailsArray = (ArrayNode) dataNode.get("addressDetails");
                            } else {
                                addressDetailsArray = objectMapper.createArrayNode();
                                dataNode.set("addressDetails", addressDetailsArray);
                            }

                            // Add all new addresses
                            for (org.pucar.dristi.web.models.Address address : party.getAddresses()) {
                                ObjectNode newAddress = objectMapper.createObjectNode();
                                newAddress.putPOJO("addressDetails", address);
                                String addressId = UUID.randomUUID().toString();
                                address.setId(addressId);
                                newAddress.put("id", addressId);
                                addressDetailsArray.add(newAddress);
                            }
                        }
                    }

                }else if("WITNESS".equalsIgnoreCase(partyType)){
                   List<WitnessDetails> witnessDetails = courtCase.getWitnessDetails();
                   for(WitnessDetails witnessDetail : witnessDetails){
                       if(witnessDetail.getUniqueId().equals(uniqueId.toString())){
                           for (org.pucar.dristi.web.models.Address address : party.getAddresses()) {
                               AddressDetails addressDetails = new AddressDetails();
                               WitnessAddress witnessAddress = new WitnessAddress();
                               addressDetails.setCity(address.getCity());
                               addressDetails.setDistrict(address.getDistrict());
                               addressDetails.setPincode(address.getPincode());
                               addressDetails.setState(address.getState());
                               addressDetails.setTypeOfAddress(address.getTypeOfAddress());
                               addressDetails.setCoordinates(address.getCoordinates());
                               addressDetails.setLocality(address.getLocality());

                               witnessAddress.setAddressDetails(addressDetails);
                               String uuid = UUID.randomUUID().toString();
                               witnessAddress.setId(uuid);
                               address.setId(uuid);

                               // Update address details
                               if (witnessDetail.getAddressDetails() == null) {
                                   witnessDetail.setAddressDetails(new ArrayList<>());
                               }
                               witnessDetail.getAddressDetails().add(witnessAddress);
                           }
                       }
                   }
                }
            }
            courtCase.setAdditionalDetails(objectMapper.convertValue(additionalDetails, Object.class));


        } catch (Exception e) {
            log.error("Failed to enrich additional details for address", e);
        }
    }

    public void updateCaseConversion(CaseRequest caseRequest) {
        log.info("Starting case conversion update.");
        
        try {
            CourtCase courtCase = caseRequest.getCases();
            String filingNumber = courtCase.getFilingNumber();
            String caseType = courtCase.getCaseType();

            CaseConversionDetails caseConversionDetails = buildCaseConversionDetails(courtCase, caseType);
            
            CaseConversionRequest caseConversionRequest = CaseConversionRequest.builder()
                    .requestInfo(caseRequest.getRequestInfo())
                    .caseConversionDetails(caseConversionDetails)
                    .build();
            
            producer.push(config.getCaseConversionTopic(), caseConversionRequest);
            
            log.info("Case conversion pushed to Kafka | filingNumber: {} | convertedFrom: {} | convertedTo: {} | preCaseNumber: {} | postCaseNumber: {}",
                    filingNumber, caseConversionDetails.getConvertedFrom(), caseConversionDetails.getConvertedTo(),
                    caseConversionDetails.getPreCaseNumber(), caseConversionDetails.getPostCaseNumber());
            
        } catch (Exception e) {
            log.error("Error during case conversion | filingNumber: {} | error: {}", 
                    caseRequest != null && caseRequest.getCases() != null ? caseRequest.getCases().getFilingNumber() : "unknown", 
                    e.getMessage());
        }
    }
    
    private CaseConversionDetails buildCaseConversionDetails(CourtCase courtCase, String caseType) {
        CaseConversionDetails caseConversionDetails = CaseConversionDetails.builder()
                .caseId(courtCase.getId().toString())
                .filingNumber(courtCase.getFilingNumber())
                .cnrNumber(courtCase.getCnrNumber())
                .tenantId(courtCase.getTenantId())
                .build();
        
        Long dateOfConversion = dateUtil.getEpochFromLocalDate(LocalDate.now());
        
        if (CMP.equalsIgnoreCase(caseType) && courtCase.getCmpNumber() != null) {
            caseConversionDetails.setConvertedFrom(FILING);
            caseConversionDetails.setConvertedTo(CMP);
            caseConversionDetails.setPreCaseNumber(courtCase.getFilingNumber());
            caseConversionDetails.setPostCaseNumber(courtCase.getCmpNumber());
            caseConversionDetails.setDateOfConversion(dateOfConversion);
        } else if (Boolean.TRUE.equals(courtCase.getIsLPRCase()) && courtCase.getLprNumber() != null) {
            caseConversionDetails.setConvertedFrom(ST);
            caseConversionDetails.setConvertedTo(LP);
            caseConversionDetails.setPreCaseNumber(courtCase.getCourtCaseNumber());
            caseConversionDetails.setPostCaseNumber(courtCase.getLprNumber());
            caseConversionDetails.setDateOfConversion(dateOfConversion);
        } else if (courtCase.getLprNumber() != null && courtCase.getCourtCaseNumberBackup() != null && courtCase.getCourtCaseNumber() != null) {
            caseConversionDetails.setConvertedFrom(LP);
            caseConversionDetails.setConvertedTo(ST);
            caseConversionDetails.setPreCaseNumber(courtCase.getLprNumber());
            caseConversionDetails.setPostCaseNumber(courtCase.getCourtCaseNumber());
            caseConversionDetails.setDateOfConversion(dateOfConversion);
        } else if (ST.equalsIgnoreCase(caseType) && courtCase.getCourtCaseNumber() != null) {
            caseConversionDetails.setConvertedFrom(CMP);
            caseConversionDetails.setConvertedTo(ST);
            caseConversionDetails.setPreCaseNumber(courtCase.getCmpNumber());
            caseConversionDetails.setPostCaseNumber(courtCase.getCourtCaseNumber());
            caseConversionDetails.setDateOfConversion(dateOfConversion);
        }
        
        return caseConversionDetails;
    }
}
