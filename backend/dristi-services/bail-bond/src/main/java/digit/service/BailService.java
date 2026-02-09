package digit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import digit.config.Configuration;
import digit.enrichment.BailRegistrationEnrichment;
import digit.kafka.Producer;
import digit.repository.BailRepository;

import digit.util.*;
import digit.validator.BailValidator;
import digit.web.models.*;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.ZoneId;
import java.time.ZonedDateTime;

import java.util.*;
import java.util.stream.Collectors;

import static digit.config.ServiceConstants.*;

@Service
@Slf4j
public class BailService {

    private final BailValidator validator;
    private final BailRegistrationEnrichment enrichmentUtil;
    private final Producer producer;
    private final Configuration config;
    private final WorkflowService workflowService;
    private final BailRepository bailRepository;
    private final EncryptionDecryptionUtil encryptionDecryptionUtil;
    private final ObjectMapper objectMapper;
    private final UrlShortenerUtil urlShortenerUtil;
    private final NotificationService notificationService;
    private final FileStoreUtil fileStoreUtil;
    private final CaseUtil caseUtil;
    private final CipherUtil cipherUtil;
    private final ESignUtil eSignUtil;
    private final XmlRequestGenerator xmlRequestGenerator;
    private final Configuration configuration;
    private final IndexerUtils indexerUtils;
    private final UserUtil userUtil;

    @Autowired
    public BailService(BailValidator validator, BailRegistrationEnrichment enrichmentUtil, Producer producer, Configuration config, WorkflowService workflowService, BailRepository bailRepository, EncryptionDecryptionUtil encryptionDecryptionUtil, ObjectMapper objectMapper, UrlShortenerUtil urlShortenerUtil, NotificationService notificationService, FileStoreUtil fileStoreUtil, CaseUtil caseUtil, CipherUtil cipherUtil, ESignUtil eSignUtil, XmlRequestGenerator xmlRequestGenerator, Configuration configuration, IndexerUtils indexerUtils, UserUtil userUtil) {
        this.validator = validator;
        this.enrichmentUtil = enrichmentUtil;
        this.producer = producer;
        this.config = config;
        this.workflowService = workflowService;
        this.bailRepository = bailRepository;
        this.encryptionDecryptionUtil = encryptionDecryptionUtil;
        this.objectMapper = objectMapper;
        this.urlShortenerUtil = urlShortenerUtil;
        this.notificationService = notificationService;
        this.fileStoreUtil = fileStoreUtil;
        this.caseUtil = caseUtil;
        this.cipherUtil = cipherUtil;
        this.eSignUtil = eSignUtil;
        this.xmlRequestGenerator = xmlRequestGenerator;
        this.configuration = configuration;
        this.indexerUtils = indexerUtils;
        this.userUtil = userUtil;
    }


    // add document comment and logs
    public Bail createBail(BailRequest bailRequest) {

        // Validation
        validator.validateBailRegistration(bailRequest);

        // Enrichment
        enrichmentUtil.enrichBailOnCreation(bailRequest);

        // Workflow update
        if (!ObjectUtils.isEmpty(bailRequest.getBail().getWorkflow())) {
            workflowService.updateWorkflowStatus(bailRequest);
        }

        Bail originalBail = bailRequest.getBail();

        Bail encryptedBail = encryptionDecryptionUtil.encryptObject(originalBail, config.getBailEncrypt(), Bail.class);
        bailRequest.setBail(encryptedBail);

        producer.push(config.getBailCreateTopic(), bailRequest);

        return originalBail;
    }

    private void callNotificationServiceForSMS(BailRequest bailRequest) {
        try {
            Bail bail = bailRequest.getBail();
            String action = bail.getWorkflow().getAction();
            String messageCode = getMessageCode(action);

            if (StringUtils.isBlank(messageCode)) {
                log.warn("No messageCode found for action: {}", action);
                return;
            }

            log.info("Sending notifications for messageCode: {}", messageCode);
            Set<String> smsTopics = Arrays.stream(messageCode.split(","))
                    .map(String::trim)
                    .collect(Collectors.toSet());

            SmsTemplateData smsTemplateData = buildSmsTemplateData(bailRequest);

            RequestInfo requestInfo = bailRequest.getRequestInfo();

            CaseCriteria criteria = CaseCriteria.builder()
                    .filingNumber(bail.getFilingNumber())
                    .defaultFields(true)
                    .build();
            CaseSearchRequest caseSearchRequest = CaseSearchRequest.builder()
                    .requestInfo(bailRequest.getRequestInfo())
                    .criteria(Collections.singletonList(criteria))
                    .build();
            JsonNode caseDetails = caseUtil.searchCaseDetails(caseSearchRequest);
            String substage = caseUtil.getSubstage(caseDetails);
            if(APPEARANCE.equalsIgnoreCase(substage)){
                // Notify Sureties
                if (smsTopics.contains(BAIL_BOND_INITIATED_SURETY)) {
                    bail.getSureties().stream()
                            .map(Surety::getMobileNumber)
                            .filter(StringUtils::isNotBlank)
                            .forEach(mobile -> notificationService.sendNotification(requestInfo, smsTemplateData, BAIL_BOND_INITIATED_SURETY, mobile));
                }

                // Notify Litigant
                if (smsTopics.contains(BAIL_BOND_INITIATED_LITIGANT)) {
                    String litigantMobile = bail.getLitigantMobileNumber();
                    if (StringUtils.isNotBlank(litigantMobile)) {
                        notificationService.sendNotification(requestInfo, smsTemplateData, BAIL_BOND_INITIATED_LITIGANT, litigantMobile);
                    }
                }
            }

        } catch (Exception e) {
            log.error("Error sending notification for bailRequest: {}", bailRequest, e);
        }
    }

    private void callNotificationServiceForEmail(BailRequest bailRequest) {
        try{
            Bail bail = bailRequest.getBail();
            String action = bail.getWorkflow().getAction();

            String emailCode = getEmailCode(action);
            if(StringUtils.isBlank(emailCode)){
                log.warn("No emailCode found for action: {}", action);
                return;
            }

            log.info("Sending emails for emailCode: {}", emailCode);
            Set<String> emailTopics = Arrays.stream(emailCode.split(","))
                    .map(String::trim)
                    .collect(Collectors.toSet());
            EmailTemplateData emailTemplateData = EmailTemplateData.builder()
                    .caseNumber(bail.getCaseNumber())
                    .caseName(bail.getCaseTitle())
                    .shortenedURL(bail.getShortenedURL())
                    .tenantId(bail.getTenantId())
                    .build();

            // Send Email to Sureties
            if(emailTopics.contains(BAIL_BOND_INITIATED_SURETY)){
                log.info("Sending email to sureties");
                if(!ObjectUtils.isEmpty(bail.getSureties())){
                    bail.getSureties()
                            .forEach(surety -> { sendEmailToRecipient(bailRequest, emailTemplateData, SURETY, surety.getName(), surety.getEmail());
                        });
                }
            }

            // Send email to litigant
            if(emailTopics.contains(BAIL_BOND_INITIATED_LITIGANT)){
                log.info("Sending email to litigant");
                List<User> users = userUtil.getUserListFromUserUuid(List.of(bail.getLitigantId()));
                if(users!=null && !users.isEmpty()){
                    User user = users.get(0);
                    String litigantName = user.getName();
                    String litigantEmailId = user.getEmailId();
                    sendEmailToRecipient(bailRequest, emailTemplateData, LITIGANT, litigantName, litigantEmailId);
                }
            }

            // Send email to advocate
            if(!bail.getAuditDetails().getCreatedBy().equalsIgnoreCase(bail.getLitigantId())
                    && emailTopics.contains(BAIL_BOND_INITIATED_ADVOCATE)){
                log.info("Sending email to advocate");
                List<User> users = userUtil.getUserListFromUserUuid(List.of(bail.getAuditDetails().getCreatedBy()));
                if(users!=null && !users.isEmpty()){
                    User user = users.get(0);
                    boolean isAdvocate = user.getRoles() != null && user.getRoles().stream().anyMatch(role -> role.getCode() != null && role.getCode().contains(ADVOCATE_ROLE));
                    if(!isAdvocate){
                        throw new CustomException(INVALID_INPUT, "createdBy does not match the litigantId or any advocate uuid");
                    }
                    String advocateName = user.getName();
                    String advocateEmailId = user.getEmailId();
                    sendEmailToRecipient(bailRequest, emailTemplateData, ADVOCATE, advocateName, advocateEmailId);
                }
            }

        } catch (Exception e) {
            log.error("Error sending email for bailRequest: {}", bailRequest, e);
        }
    }

    private void sendEmailToRecipient(BailRequest bailRequest, EmailTemplateData emailTemplateData, String recipientType, String name, String email) {
        if (ObjectUtils.isEmpty(name) || ObjectUtils.isEmpty(email)) {
            log.error("Invalid recipient details");
            return;
        }
        EmailRecipientData recipientData = EmailRecipientData.builder()
                .type(recipientType)
                .name(name)
                .email(email)
                .build();
        notificationService.sendEmail(bailRequest, emailTemplateData, recipientData);
    }

    private SmsTemplateData buildSmsTemplateData(BailRequest bailRequest) {

        Bail bail = bailRequest.getBail();

        CaseCriteria criteria = CaseCriteria.builder()
                .filingNumber(bail.getFilingNumber())
                .defaultFields(true)
                .build();
        CaseSearchRequest caseSearchRequest = CaseSearchRequest.builder()
                .requestInfo(bailRequest.getRequestInfo())
                .criteria(Collections.singletonList(criteria))
                .build();
        JsonNode caseDetails = caseUtil.searchCaseDetails(caseSearchRequest);

        String cmpNumber = caseUtil.getCmpNumber(caseDetails);
        String courtCaseNumber = caseUtil.getCourtCaseNumber(caseDetails);

        return SmsTemplateData.builder()
                .filingNumber(bail.getFilingNumber())
                .courtCaseNumber(courtCaseNumber)
                .shortenedUrl(bail.getShortenedURL())
                .cmpNumber(cmpNumber)
                .tenantId(bail.getTenantId())
                .build();

    }


    private String getMessageCode(String action) {
        if (action.equalsIgnoreCase(INITIATE_E_SIGN)) {
            return BAIL_BOND_INITIATED_SMS;
        }
        return null;
    }


  
    private String getEmailCode(String action){
        if(action.equalsIgnoreCase(INITIATE_E_SIGN)){
            return BAIL_BOND_INITIATED_EMAIL;
        }
        return null;
    }

    public void mergeDeletedDocumentsIntoPayload(BailRequest bailRequest, Bail existingBail) {
        Bail updatedBail = bailRequest.getBail();

        // Bail documents
        if (updatedBail.getDocuments() != null) {
            Set<String> updatedBailDocIds = fileStoreIds(updatedBail.getDocuments());
            List<Document> missingBailDocs =
                    Optional.ofNullable(existingBail.getDocuments())
                            .orElse(Collections.emptyList())
                            .stream()
                            .filter(doc -> !updatedBailDocIds.contains(doc.getFileStore()))
                            .peek(doc -> doc.setIsActive(false))
                            .toList();

            updatedBail.getDocuments().addAll(missingBailDocs);

        }
        // Surety documents
        if (updatedBail.getSureties() != null && existingBail.getSureties() != null) {
            Map<String, Surety> updatedSuretyMap = updatedBail.getSureties().stream()
                    .collect(Collectors.toMap(Surety::getId, s -> s));

            for (Surety existingSurety : existingBail.getSureties()) {
                Surety updatedSurety = updatedSuretyMap.get(existingSurety.getId());
                if (updatedSurety == null) continue;

                Set<String> updatedSuretyDocIds = fileStoreIds(updatedSurety.getDocuments());

                List<Document> missingSuretyDocs =
                        Optional.ofNullable(existingSurety.getDocuments())
                                .orElse(Collections.emptyList())
                                .stream()
                                .filter(doc -> !updatedSuretyDocIds.contains(doc.getFileStore()))
                                .peek(doc -> doc.setIsActive(false))
                                .toList();

                if (updatedSurety.getDocuments() == null)
                    updatedSurety.setDocuments(new ArrayList<>());
                updatedSurety.getDocuments().addAll(missingSuretyDocs);
            }
        }
    }

    private Set<String> fileStoreIds(List<Document> documents) {
        if (documents == null) return Collections.emptySet();
        return documents.stream()
                .map(Document::getFileStore)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    public Set<String> extractInactiveFileStoreIds(BailRequest bailRequest) {
        Set<String> inactiveFileStoreIds = new HashSet<>();

        Bail bail = bailRequest.getBail();

        // Bail-level
        if (bail.getDocuments() != null) {
            bail.getDocuments().stream()
                    .filter(doc -> Boolean.FALSE.equals(doc.getIsActive()))
                    .map(Document::getFileStore)
                    .filter(Objects::nonNull)
                    .forEach(inactiveFileStoreIds::add);
        }

        // Surety-level
        if (bail.getSureties() != null) {
            for (Surety surety : bail.getSureties()) {
                if (surety.getDocuments() != null) {
                    surety.getDocuments().stream()
                            .filter(doc -> Boolean.FALSE.equals(doc.getIsActive()))
                            .map(Document::getFileStore)
                            .filter(Objects::nonNull)
                            .forEach(inactiveFileStoreIds::add);
                }
            }
        }

        return inactiveFileStoreIds;
    }

    public Bail updateBail(BailRequest bailRequest) {

        // Check if bail exists
        Bail existingBail = validator.validateBailExists(bailRequest);

        // Enrich new documents or sureties if any
        enrichmentUtil.enrichBailUponUpdate(bailRequest, existingBail);

        if (bailRequest.getBail().getWorkflow() != null
                && bailRequest.getBail().getWorkflow().getAction() != null
                && (E_SIGN.equalsIgnoreCase(bailRequest.getBail().getWorkflow().getAction()) || INITIATE_E_SIGN.equalsIgnoreCase(bailRequest.getBail().getWorkflow().getAction()))
                && !bailRequest.getBail().getLitigantSigned()
                && bailRequest.getBail().getLitigantId() != null) {
            List<String> assignees = new ArrayList<>();
            WorkflowObject workflow = bailRequest.getBail().getWorkflow();
            assignees.add(bailRequest.getBail().getLitigantId());
            workflow.setAssignes(assignees);
            if (!bailRequest.getBail().getLitigantId().equalsIgnoreCase(bailRequest.getBail().getAuditDetails().getCreatedBy())) {
                ObjectNode additionalDetails = updateAdditionalDetails(workflow.getAdditionalDetails(), bailRequest.getBail().getAuditDetails().getCreatedBy());
                workflow.setAdditionalDetails(additionalDetails);
                assignees.add(bailRequest.getBail().getAuditDetails().getCreatedBy());
                workflow.setAssignes(assignees);
            }
        }

        Boolean lastSigned = checkItsLastSign(bailRequest);
        if (!ObjectUtils.isEmpty(bailRequest.getBail().getWorkflow())) {
            workflowService.updateWorkflowStatus(bailRequest);
        }

        try {
            if (lastSigned) {
                log.info("Updating Bail Workflow");
                WorkflowObject workflowObject = new WorkflowObject();
                workflowObject.setAction(E_SIGN_COMPLETE);

                bailRequest.getBail().setWorkflow(workflowObject);
                bailRequest.getRequestInfo().getUserInfo().getRoles().add(Role.builder().id(123L).code(SYSTEM).name(SYSTEM).tenantId(bailRequest.getBail().getTenantId()).build());
                workflowService.updateWorkflowStatus(bailRequest);
            }
        } catch (Exception e) {
            log.error("Error updating bail workflow", e);
            throw new CustomException(WORKFLOW_SERVICE_EXCEPTION, e.getMessage());
        }

        mergeDeletedDocumentsIntoPayload(bailRequest, existingBail);

        Set<String> fileStoreIdsToDelete = extractInactiveFileStoreIds(bailRequest);

        if (!fileStoreIdsToDelete.isEmpty()) {
            fileStoreUtil.deleteFilesByFileStore(fileStoreIdsToDelete, bailRequest.getBail().getTenantId());
            log.info("Deleted files for ids: {}", fileStoreIdsToDelete);
        }

        if (EDIT.equalsIgnoreCase(bailRequest.getBail().getWorkflow().getAction())) {
            expireTheShorteningUrl(bailRequest);
        }

        // Sms and Email
        if (INITIATE_E_SIGN.equalsIgnoreCase(bailRequest.getBail().getWorkflow().getAction())) {
            Bail bail = bailRequest.getBail();
            String shortenedUrl = urlShortenerUtil.createShortenedUrl(bail.getTenantId(), bail.getBailId());
            bail.setShortenedURL(shortenedUrl);
            log.info("Calling notification service");
            callNotificationServiceForSMS(bailRequest);
            callNotificationServiceForEmail(bailRequest);
        }

        insertBailIndexEntry(bailRequest.getBail());

        Bail originalBail = bailRequest.getBail();
        Bail encryptedBail = encryptionDecryptionUtil.encryptObject(originalBail, config.getBailEncrypt(), Bail.class);
        bailRequest.setBail(encryptedBail);
        producer.push(config.getBailUpdateTopic(), bailRequest);

       // Filter out inactive bail documents
        if (originalBail.getDocuments() != null) {
            List<Document> activeBailDocs = originalBail.getDocuments().stream()
                    .filter(doc -> doc.getIsActive() == null || doc.getIsActive())
                    .toList();
            originalBail.setDocuments(activeBailDocs);
        }

        // Filter out inactive sureties and their inactive documents
        if (originalBail.getSureties() != null) {
            List<Surety> activeSureties = originalBail.getSureties().stream()
                    .filter(surety -> surety.getIsActive() == null || surety.getIsActive())
                    .peek(surety -> {
                        // Filter inactive documents in each surety
                        if (surety.getDocuments() != null) {
                            List<Document> activeSuretyDocs = surety.getDocuments().stream()
                                    .filter(doc -> doc.getIsActive() == null || doc.getIsActive())
                                    .toList();
                            surety.setDocuments(activeSuretyDocs);
                        }
                    })
                    .toList();
            originalBail.setSureties(activeSureties);
        }

        return originalBail;
    }

    private void expireTheShorteningUrl(BailRequest bailRequest) {
        urlShortenerUtil.expireTheUrl(bailRequest);
    }

    private Boolean checkItsLastSign(BailRequest bailRequest) {

        Bail bail = bailRequest.getBail();
        WorkflowObject workflow = bail.getWorkflow();
        if (workflow == null || !E_SIGN.equalsIgnoreCase(workflow.getAction())) {
            return false;
        }
        if (!Boolean.TRUE.equals(bail.getLitigantSigned())) {
            log.info("Litigant has not signed for bail :  {} ", bail.getBailId());
            return false;
        }


        if (bail.getBailType().equals(Bail.BailTypeEnum.PERSONAL)) {
            log.info("Bail type is personal and litigant has signed successfully for bail :  {} ", bail.getBailId());
            return true;
        }

        boolean allSuretiesSigned = false;
        if (!ObjectUtils.isEmpty(bailRequest.getBail().getSureties())) {
            allSuretiesSigned = bailRequest.getBail().getSureties().stream()
                    .allMatch(Surety::getHasSigned);
        }
        if (!allSuretiesSigned) {
            log.info("Some sureties have not signed for bail :  {} ", bail.getBailId());
            return false;
        }
        log.info("All sureties and litigant have signed successfully for bail :  {} ", bail.getBailId());
        return true;
    }

    public List<Bail> searchBail(BailSearchRequest bailSearchRequest) {
        try {
            log.info("Starting bail search with parameters :: {}", bailSearchRequest);

            enrichBailSearchRequest(bailSearchRequest);

            if (bailSearchRequest.getCriteria() != null && bailSearchRequest.getCriteria().getSuretyMobileNumber() != null) {
                bailSearchRequest.setCriteria(encryptionDecryptionUtil.encryptObject(bailSearchRequest.getCriteria(), "BailSearch", BailSearchCriteria.class));
            }

            List<Bail> bailList = bailRepository.getBails(bailSearchRequest);
            List<Bail> decryptedBailList = new ArrayList<>();
            bailList.forEach(bail -> {
                decryptedBailList.add(encryptionDecryptionUtil.decryptObject(bail, config.getBailDecrypt(), Bail.class, bailSearchRequest.getRequestInfo()));
            });
            return decryptedBailList;

        } catch (Exception e) {
            log.error("Error while fetching to search results {}", e.toString());
            throw new CustomException("BAIL_SEARCH_ERR", e.getMessage());
        }
    }

    public void enrichBailSearchRequest(BailSearchRequest bailSearchRequest) {
        RequestInfo requestInfo = bailSearchRequest.getRequestInfo();
        User userInfo = requestInfo.getUserInfo();
        String type = userInfo.getType();

        switch (type.toLowerCase()) {
            case "employee", "system" -> {
            }
            case "citizen" -> {
                bailSearchRequest.getCriteria().setUserUuid(userInfo.getUuid());
                enrichAdvocateAndClerkUuids(requestInfo, bailSearchRequest.getCriteria());
            }
            default -> throw new IllegalArgumentException("Unknown user type: " + type);
        }
    }

    private void enrichAdvocateAndClerkUuids(RequestInfo requestInfo, BailSearchCriteria searchCriteria) {
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

        if (filingNumber == null || filingNumber.isEmpty()) {
            return;
        }

        try {
            CaseCriteria caseCriteria = CaseCriteria.builder()
                    .filingNumber(filingNumber)
                    .defaultFields(false)
                    .build();

            CaseSearchRequest caseSearchRequest = CaseSearchRequest.builder()
                    .requestInfo(requestInfo)
                    .criteria(Collections.singletonList(caseCriteria))
                    .tenantId(tenantId)
                    .build();

            JsonNode caseDetails = caseUtil.searchCaseDetails(caseSearchRequest);
            if (caseDetails == null || !caseDetails.isArray() || caseDetails.isEmpty()) {
                return;
            }

            CourtCase courtCase = objectMapper.convertValue(caseDetails.get(0), CourtCase.class);

            if (courtCase.getAdvocateOffices() == null) {
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

            log.info("Enriched advocateAndClerkUuids for bail search: {}", uuidSet);
            searchCriteria.setAdvocateAndClerkUuids(new ArrayList<>(uuidSet));

        } catch (Exception e) {
            log.error("Error while enriching advocate/clerk UUIDs for bail search", e);
        }
    }

    private boolean hasRole(User userInfo, String roleCode) {
        if (userInfo.getRoles() == null) {
            return false;
        }
        return userInfo.getRoles().stream()
                .anyMatch(role -> roleCode.equals(role.getCode()));
    }

    public List<BailToSign> createBailToSignRequest(BailsToSignRequest request) {
        log.info("creating bail to sign request, result= IN_PROGRESS, bailCriteria:{}", request.getCriteria().size());

        List<CoordinateCriteria> coordinateCriteria = new ArrayList<>();
        Map<String, BailsCriteria> bailsCriteriaMap = new HashMap<>();

        request.getCriteria().forEach(criterion -> {
            CoordinateCriteria criteria = new CoordinateCriteria();
            criteria.setFileStoreId(criterion.getFileStoreId());
            criteria.setPlaceholder(criterion.getPlaceholder());
            criteria.setTenantId(criterion.getTenantId());
            coordinateCriteria.add(criteria);
            bailsCriteriaMap.put(criterion.getFileStoreId(), criterion);
        });

        CoordinateRequest coordinateRequest = CoordinateRequest.builder()
                .requestInfo(request.getRequestInfo())
                .criteria(coordinateCriteria).build();
        List<Coordinate> coordinateForSign = eSignUtil.getCoordinateForSign(coordinateRequest);

        if (coordinateForSign.isEmpty() || coordinateForSign.size() != request.getCriteria().size()) {
            throw new CustomException(COORDINATES_ERROR, "error in co-ordinates");
        }

        List<BailToSign> bailToSign = new ArrayList<>();
        for (Coordinate coordinate : coordinateForSign) {
            BailToSign bail = new BailToSign();
            Resource resource = null;
            try {
                resource = fileStoreUtil.fetchFileStoreObjectById(coordinate.getFileStoreId(), coordinate.getTenantId());
            } catch (Exception e) {
                throw new CustomException(FILE_STORE_UTILITY_EXCEPTION, "something went wrong while signing");
            }
            try {
                String base64Document = cipherUtil.encodePdfToBase64(resource);
                String coord = (int) Math.floor(coordinate.getX()) + "," + (int) Math.floor(coordinate.getY());
                String txnId = UUID.randomUUID().toString();
                String pageNo = String.valueOf(coordinate.getPageNumber());
                ZonedDateTime timestamp = ZonedDateTime.now(ZoneId.of(configuration.getZoneId()));

                String xmlRequest = generateRequest(base64Document, timestamp.toString(), txnId, coord, pageNo);
                String bailId = bailsCriteriaMap.get(coordinate.getFileStoreId()).getBailId();
                bail.setBailId(bailId);
                bail.setRequest(xmlRequest);

                bailToSign.add(bail);
            } catch (Exception e) {
                throw new CustomException(BAIL_SIGN_ERROR, "something went wrong while signing");
            }
        }
        log.info("creating bail to sign request, result= SUCCESS, bailCriteria:{}", request.getCriteria().size());
        return bailToSign;
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
        pdf.put(SIZE, configuration.getEsignSignatureWidth() + "," + configuration.getEsignSignatureHeight());
        pdf.put(DATE_FORMAT, ESIGN_DATE_FORMAT);
        requestData.put(PDF, pdf);

        requestData.put(DATA, base64Doc);

        String xmlRequest = xmlRequestGenerator.createXML("request", requestData);
        log.info("generating request, result= SUCCESS, timeStamp:{}, txnId:{}, coordination:{}, pageNumber:{}", timeStamp, txnId, coordination, pageNumber);

        return xmlRequest;
    }

    public List<Bail> updateBailWithSignDoc(@Valid UpdateSignedBailRequest request) {
        log.info("Updating Bail With Signed Doc, result= IN_PROGRESS, signedBails:{}", request.getSignedBails().size());
        List<Bail> updatedBails = new ArrayList<>();

        RequestInfo requestInfo = request.getRequestInfo();
        for (SignedBail signedBail : request.getSignedBails()) {
            String bailId = signedBail.getBailId();
            String signedBailData = signedBail.getSignedBailData();
            Boolean isSigned = signedBail.getSigned();
            String tenantId = signedBail.getTenantId();

            if (isSigned) {
                try {
                    // Fetch the bail
                    BailSearchCriteria criteria = BailSearchCriteria.builder()
                            .bailId(bailId)
                            .tenantId(tenantId).build();
                    Pagination pagination = Pagination.builder().limit(1).offSet(0).build();
                    BailSearchRequest bailSearchRequest = BailSearchRequest.builder()
                            .criteria(criteria)
                            .pagination(pagination)
                            .build();
                    List<Bail> bailList = bailRepository.getBails(bailSearchRequest);

                    if (bailList.isEmpty()) {
                        throw new CustomException(EMPTY_BAILS_ERROR, "empty bails found for the given criteria");
                    }
                    Bail bail = bailList.get(0);
                    bail = encryptionDecryptionUtil.decryptObject(bail, config.getBailDecrypt(), Bail.class, RequestInfo.builder().userInfo(User.builder().build()).build());

                    // Update document with signed PDF
                    MultipartFile multipartFile = cipherUtil.decodeBase64ToPdf(signedBailData, BAIL_BOND_PDF_NAME);
                    String fileStoreId = fileStoreUtil.storeFileInFileStore(multipartFile, tenantId);


                        Document document = Document.builder()
                                .documentType(SIGNED)
                                .fileStore(fileStoreId)
                                .isActive(true)
                                .documentName(BAIL_BOND_PDF_NAME)
                                .additionalDetails(Map.of(NAME, BAIL_BOND_PDF_NAME))
                                .build();
                    bail.setDocuments(new ArrayList<>(List.of(document)));

                    if (!ObjectUtils.isEmpty(bail.getSureties())) {
                        bail.getSureties().forEach(surety -> surety.setIsApproved(true));
                    }

                    WorkflowObject workflowObject = new WorkflowObject();
                    workflowObject.setAction(SIGN);

                    bail.setWorkflow(workflowObject);

                    BailRequest updateBailWithJudgeApproval = BailRequest.builder().requestInfo(requestInfo).bail(bail).build();

                    Bail approvedBail = updateBail(updateBailWithJudgeApproval);
                    updatedBails.add(approvedBail);

                    log.info("Updating bail with signed doc, result= SUCCESS,signedBails:{}", request.getSignedBails().size());

                    // update the bail here
                } catch (Exception e) {
                    log.error("Error while updating bail, bailNumber: {}", bailId, e);
                    throw new CustomException(BAILS_BULK_SIGN_EXCEPTION, "Error while updating bail: " + e.getMessage());
                }
            }
        }
        return updatedBails;
    }


    private Map<String, Object> createAttribute(String name, String value) {
        Map<String, Object> attribute = new LinkedHashMap<>();
        Map<String, String> attrData = new LinkedHashMap<>();
        attrData.put(NAME, name);
        attrData.put(VALUE, value);
        attribute.put(ATTRIBUTE, attrData);
        return attribute;
    }

    public void insertBailIndexEntry(Bail bail) {
        try {
            if (bail != null) {
                log.info("Inserting Bail entry in bail-bond-index (inbox): {}", bail);
                String bulkRequest = indexerUtils.buildPayload(bail);
                if (!bulkRequest.isEmpty()) {
                    String uri = config.getEsHostUrl() + config.getBulkPath();
                    indexerUtils.esPostManual(uri, bulkRequest);
                }
            }
        } catch (CustomException e) {
            log.error("Custom Exception occurred while inserting bail index entry");
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while inserting bail index entry");
            throw new CustomException(BAIL_BOND_INDEX_EXCEPTION, e.getMessage());
        }
    }


    private ObjectNode updateAdditionalDetails(Object existingDetails, String excludeUuid) {
        ObjectNode detailsNode;
        if (existingDetails == null) {
            detailsNode = objectMapper.createObjectNode();
        } else {
            detailsNode = objectMapper.convertValue(existingDetails, ObjectNode.class);
        }
        ArrayNode excludedAssignedUuidsArray = detailsNode.putArray("excludedAssignedUuids");
        excludedAssignedUuidsArray.add(excludeUuid);

        return detailsNode;
    }

}
