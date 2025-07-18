package digit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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

    @Autowired
    public BailService(BailValidator validator, BailRegistrationEnrichment enrichmentUtil, Producer producer, Configuration config, WorkflowService workflowService, BailRepository bailRepository, EncryptionDecryptionUtil encryptionDecryptionUtil, ObjectMapper objectMapper, UrlShortenerUtil urlShortenerUtil, NotificationService notificationService, FileStoreUtil fileStoreUtil, CaseUtil caseUtil, CipherUtil cipherUtil, ESignUtil eSignUtil, XmlRequestGenerator xmlRequestGenerator, Configuration configuration, IndexerUtils indexerUtils) {
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
    }


    // add document comment and logs
    public Bail createBail(BailRequest bailRequest) {

        // Validation
        validator.validateBailRegistration(bailRequest);

        // Enrichment
        enrichmentUtil.enrichBailOnCreation(bailRequest);

        // Workflow update
        if(!ObjectUtils.isEmpty(bailRequest.getBail().getWorkflow())){
            workflowService.updateWorkflowStatus(bailRequest);
        }

        Bail originalBail = bailRequest.getBail();

        Bail encryptedBail = encryptionDecryptionUtil.encryptObject(originalBail, config.getBailEncrypt(), Bail.class);
        bailRequest.setBail(encryptedBail);

        producer.push(config.getBailCreateTopic(), bailRequest);

        return originalBail;
    }

    private void callNotificationService(BailRequest bailRequest) {
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

        } catch (Exception e) {
            log.error("Error sending notification for bailRequest: {}", bailRequest, e);
        }
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

    private Set<String> getFilestoreToDelete(BailRequest bailRequest, Bail existingBail) {
        Set<String> fileStoreToDeleteIds = new HashSet<>();

        Set<String> newFileStoreIds = new HashSet<>();
        Set<String> existingFileStoreIds = new HashSet<>();

        // Collect all existing filestore IDs from DB
        if (existingBail.getDocuments() != null) {
            for (Document document : existingBail.getDocuments()) {
                existingFileStoreIds.add(document.getFileStore());
            }
        }
        if (existingBail.getSureties() != null) {
            for (Surety surety : existingBail.getSureties()) {
                if (surety.getDocuments() != null) {
                    for (Document document : surety.getDocuments()) {
                        existingFileStoreIds.add(document.getFileStore());
                    }
                }
            }
        }

        // Collect all new filestore IDs from request
        if (bailRequest.getBail().getDocuments() != null) {
            for (Document document : bailRequest.getBail().getDocuments()) {
                newFileStoreIds.add(document.getFileStore());

                // mark for deletion if isActive=false
                if (!document.getIsActive()) {
                    fileStoreToDeleteIds.add(document.getFileStore());
                }
            }
        }
        if (bailRequest.getBail().getSureties() != null) {
            for (Surety surety : bailRequest.getBail().getSureties()) {
                if (surety.getDocuments() != null) {
                    for (Document document : surety.getDocuments()) {
                        newFileStoreIds.add(document.getFileStore());

                        // mark for deletion if isActive=false
                        if (!document.getIsActive()) {
                            fileStoreToDeleteIds.add(document.getFileStore());
                        }
                    }
                }
            }
        }

        // Add the ones that existed before but are no longer present in the new request
        for (String oldFilestore : existingFileStoreIds) {
            if (!newFileStoreIds.contains(oldFilestore)) {
                fileStoreToDeleteIds.add(oldFilestore);
            }
        }

        return fileStoreToDeleteIds;
    }


    public Bail updateBail(BailRequest bailRequest) {

        // Check if bail exists
        Bail existingBail = validator.validateBailExists(bailRequest);

        // Enrich new documents or sureties if any
        enrichmentUtil.enrichBailUponUpdate(bailRequest);

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
                workflowService.updateWorkflowStatus(bailRequest);
            }
        } catch (Exception e) {
            log.error("Error updating bail workflow", e);
            throw new CustomException(WORKFLOW_SERVICE_EXCEPTION, e.getMessage());
        }

        if (bailRequest.getBail().getWorkflow() != null
                && bailRequest.getBail().getWorkflow().getAction() != null
                && (E_SIGN.equalsIgnoreCase(bailRequest.getBail().getWorkflow().getAction()) || INITIATE_E_SIGN.equalsIgnoreCase(bailRequest.getBail().getWorkflow().getAction()))
                && !bailRequest.getBail().getLitigantSigned()
                && bailRequest.getBail().getLitigantId() != null) {
            List<String> assignees = new ArrayList<>();
            assignees.add(bailRequest.getBail().getLitigantId());
            bailRequest.getBail().getWorkflow().setAssignes(assignees);
        }

        Set<String> fileStoreToDeleteIds = getFilestoreToDelete(bailRequest,existingBail);

        if(!fileStoreToDeleteIds.isEmpty()){
            setIsActiveFalse(bailRequest,fileStoreToDeleteIds);
            fileStoreUtil.deleteFilesByFileStore(fileStoreToDeleteIds, bailRequest.getBail().getTenantId());
            log.info("Deleted files from file store: {}", fileStoreToDeleteIds);
        }

        Bail originalBail = bailRequest.getBail();

        Bail encryptedBail = encryptionDecryptionUtil.encryptObject(originalBail, config.getBailEncrypt(), Bail.class);
        bailRequest.setBail(encryptedBail);

        if (EDIT.equalsIgnoreCase(bailRequest.getBail().getWorkflow().getAction())) {
            expireTheShorteningUrl(bailRequest);
        }

        // Sms and Email
        if (INITIATE_E_SIGN.equalsIgnoreCase(bailRequest.getBail().getWorkflow().getAction())) {
            Bail bail = bailRequest.getBail();
            String shortenedUrl = urlShortenerUtil.createShortenedUrl(bail.getTenantId(), bail.getBailId());
            bail.setShortenedURL(shortenedUrl);
            originalBail.setShortenedURL(shortenedUrl);
            log.info("Calling notification service");
            callNotificationService(bailRequest);
        }

        insertBailIndexEntry(originalBail);

        producer.push(config.getBailUpdateTopic(), bailRequest);

        return originalBail;
    }

    private void expireTheShorteningUrl(BailRequest bailRequest) {
        urlShortenerUtil.expireTheUrl(bailRequest);
    }

    private void setIsActiveFalse(BailRequest bailRequest, Set<String> fileStoreToDeleteIds) {
        if (bailRequest.getBail().getDocuments() != null) {
            for (Document document : bailRequest.getBail().getDocuments()) {
                if (fileStoreToDeleteIds.contains(document.getFileStore())) {
                    document.setIsActive(false);
                }
            }
        }
        if (bailRequest.getBail().getSureties() != null) {
            for (Surety surety : bailRequest.getBail().getSureties()) {
                if (surety.getDocuments() != null) {
                    for (Document document : surety.getDocuments()) {
                        if (fileStoreToDeleteIds.contains(document.getFileStore())) {
                            document.setIsActive(false);
                        }
                    }
                }
            }
    }
    }

    private Boolean checkItsLastSign(BailRequest bailRequest) {

        Bail bail = bailRequest.getBail();
        WorkflowObject workflow = bail.getWorkflow();
        if (workflow == null || !E_SIGN.equalsIgnoreCase(workflow.getAction())) {
            return false;
        }
        if (!Boolean.TRUE.equals(bail.getLitigantSigned())) {
            log.info("Litigant has not signed");
            return false;
        }
        boolean allSuretiesSigned = false;
        if (!ObjectUtils.isEmpty(bailRequest.getBail().getSureties())) {
            allSuretiesSigned = bailRequest.getBail().getSureties().stream()
                    .allMatch(Surety::getHasSigned);
        }
        if (!allSuretiesSigned) {
            log.info("Some sureties have not signed");
            return false;
        }
        log.info("All sureties and litigant have signed");
        return true;
    }

    public List<Bail> searchBail(BailSearchRequest bailSearchRequest) {
        try {
            log.info("Starting bail search with parameters :: {}", bailSearchRequest);

            if(bailSearchRequest.getCriteria()!=null && bailSearchRequest.getCriteria().getSuretyMobileNumber() != null) {
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
        pdf.put(SIZE, "150,100");
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

                    // Update document with signed PDF
                    MultipartFile multipartFile = cipherUtil.decodeBase64ToPdf(signedBailData, BAIL_BOND_PDF_NAME);
                    String fileStoreId = fileStoreUtil.storeFileInFileStore(multipartFile, tenantId);


                    if (bail.getDocuments() != null) {
                        bail.getDocuments().stream()
                                .filter(document -> document.getDocumentType().equals(SIGNED))
                                .findFirst()
                                .ifPresent(document -> {
                                    document.setFileStore(fileStoreId);
                                    document.setAdditionalDetails(Map.of(NAME, BAIL_BOND_PDF_NAME));
                                });
                    }

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

}
