package digit.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import digit.config.Configuration;
import digit.enrichment.DigitalizedDocumentEnrichment;
import digit.enrichment.ExaminationOfAccusedEnrichment;
import digit.kafka.Producer;
import digit.util.CaseUtil;
import digit.util.UrlShortenerUtil;
import digit.util.FileStoreUtil;
import digit.util.IndividualUtil;
import digit.validators.ExaminationOfAccusedValidator;
import digit.validators.MediationDocumentValidator;
import digit.web.models.*;
import digit.web.models.sms.SmsTemplateData;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

import static digit.config.ServiceConstants.*;

/**
 * Service for processing EXAMINATION_OF_ACCUSED type documents
 */
@Service
@Slf4j
public class ExaminationOfAccusedDocumentService implements DocumentTypeService {

    private final ExaminationOfAccusedValidator validator;
    private final DigitalizedDocumentEnrichment enrichment;
    private final ExaminationOfAccusedEnrichment examinationOfAccusedEnrichment;
    private final WorkflowService workflowService;
    private final Producer producer;
    private final Configuration config;
    private final UrlShortenerUtil urlShortenerUtil;
    private final FileStoreUtil fileStoreUtil;
    private final CaseUtil caseUtil;
    private final IndividualUtil individualUtil;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    public ExaminationOfAccusedDocumentService(ExaminationOfAccusedValidator validator, DigitalizedDocumentEnrichment enrichment, ExaminationOfAccusedEnrichment examinationOfAccusedEnrichment, WorkflowService workflowService, Producer producer, Configuration config, FileStoreUtil fileStoreUtil, UrlShortenerUtil urlShortenerUtil, CaseUtil caseUtil, IndividualUtil individualUtil, NotificationService notificationService, ObjectMapper objectMapper) {
        this.validator = validator;
        this.enrichment = enrichment;
        this.examinationOfAccusedEnrichment = examinationOfAccusedEnrichment;
        this.workflowService = workflowService;
        this.producer = producer;
        this.config = config;
        this.fileStoreUtil = fileStoreUtil;
        this.urlShortenerUtil = urlShortenerUtil;
        this.caseUtil = caseUtil;
        this.individualUtil = individualUtil;
        this.notificationService = notificationService;
        this.objectMapper = objectMapper;
    }

    @Override
    public DigitalizedDocument createDocument(DigitalizedDocumentRequest request) {

        validator.validateDigitalizedDocument(request);

        enrichment.enrichDigitalizedDocument(request);

        examinationOfAccusedEnrichment.enrichDocumentOnCreation(request);

        workflowService.updateWorkflowStatus(request);

        producer.push(config.getExaminationOfAccusedCreateTopic(), request);

        return request.getDigitalizedDocument();

    }

    @Override
    public DigitalizedDocument updateDocument(DigitalizedDocumentRequest request) {
        validator.validateDigitalizedDocument(request);

        DigitalizedDocument existingDocument = validator.checkDigitalizedDocumentExists(request.getDigitalizedDocument());

        examinationOfAccusedEnrichment.enrichDocumentOnUpdate(request);

        DigitalizedDocument document = request.getDigitalizedDocument();

        // Check if workflow action is EDIT and expire shortening URL
        if (document.getWorkflow() != null && EDIT.equalsIgnoreCase(document.getWorkflow().getAction())) {
            expireTheShorteningUrl(request);
        }

        // Check if workflow action is SUBMIT and create shortened URL
        if (document.getWorkflow() != null && SUBMIT.equalsIgnoreCase(document.getWorkflow().getAction())) {
            String shortenedUrl = urlShortenerUtil.createShortenedUrl(document.getTenantId(), document.getDocumentNumber(), String.valueOf(document.getType()));
            document.setShortenedUrl(shortenedUrl);
            log.info("Calling notification service for SMS");
            try{
                callNotificationServiceForSMS(request);
                callNotificationServiceForSMSToAccusedAdvocate(request);
            } catch (Exception e) {
                log.error("Error occurred while trying to send SMS: {}", e.getMessage());
            }

            updateWorkflowAdditionalDetails(request);

        }

        workflowService.updateWorkflowStatus(request);

        List<String> fileStoreIdsToDelete = extractInactiveFileStoreIds(request,existingDocument);

        if (!fileStoreIdsToDelete.isEmpty()) {
            fileStoreUtil.deleteFilesByFileStore(fileStoreIdsToDelete, request.getDigitalizedDocument().getTenantId());
            log.info("Deleted files for ids: {}", fileStoreIdsToDelete);
        }

        producer.push(config.getExaminationOfAccusedUpdateTopic(), request);

        return request.getDigitalizedDocument();
    }

    private void updateWorkflowAdditionalDetails(DigitalizedDocumentRequest request) {
        ObjectNode detailsNode;
        if (request.getDigitalizedDocument().getWorkflow().getAdditionalDetails() == null) {
            detailsNode = objectMapper.createObjectNode();
        } else {
            detailsNode = objectMapper.convertValue(request.getDigitalizedDocument().getWorkflow().getAdditionalDetails(), ObjectNode.class);
        }
        ArrayNode excludeRolesArray = detailsNode.putArray("excludeRoles");
        excludeRolesArray.add(EXAMINATION_CREATOR);
        excludeRolesArray.add(SYSTEM_ADMIN);
        excludeRolesArray.add(SYSTEM);

        request.getDigitalizedDocument().getWorkflow().setAdditionalDetails(detailsNode);
    }

    private void expireTheShorteningUrl(DigitalizedDocumentRequest digitalizedDocumentRequest) {
        urlShortenerUtil.expireTheUrl(digitalizedDocumentRequest);
    }

    private void callNotificationServiceForSMS(DigitalizedDocumentRequest request){
        String action = Optional.ofNullable(request.getDigitalizedDocument())
                .map(DigitalizedDocument::getWorkflow)
                .map(WorkflowObject::getAction)
                .orElse(null);
        String messageCode = getMessageCode(action);
        if(messageCode == null){
            log.info("No message code found");
            return;
        }

        RequestInfo requestInfo = request.getRequestInfo();

        JsonNode courtCase = caseUtil.getCaseFromFilingNumber(requestInfo, request.getDigitalizedDocument().getCaseFilingNumber());
        String cmpNumber = courtCase.path("cmpNumber").asText(null);
        String courtCaseNumber = courtCase.path("courtCaseNumber").asText(null);

        SmsTemplateData smsTemplateData = SmsTemplateData.builder()
                .tenantId(request.getDigitalizedDocument().getTenantId())
                .cmpNumber(cmpNumber)
                .courtCaseNumber(courtCaseNumber)
                .shortenedUrl(request.getDigitalizedDocument().getShortenedUrl())
                .build();

        String mobileNumber = Optional.ofNullable(request.getDigitalizedDocument())
                        .map(DigitalizedDocument::getExaminationOfAccusedDetails)
                        .map(ExaminationOfAccusedDetails::getAccusedMobileNumber)
                        .orElse(null);

        notificationService.sendNotification(requestInfo, smsTemplateData, messageCode, mobileNumber);
    }

    private String getMessageCode(String action){
        if(SUBMIT.equalsIgnoreCase(action)){
            return SIGN_EXAMINATION_DOCUMENT;
        }
        return null;
    }

    private void callNotificationServiceForSMSToAccusedAdvocate(DigitalizedDocumentRequest request){

        RequestInfo requestInfo = request.getRequestInfo();
        CaseCriteria caseCriteria = CaseCriteria.builder()
                .filingNumber(request.getDigitalizedDocument().getCaseFilingNumber())
                .courtId(request.getDigitalizedDocument().getCourtId())
                .defaultFields(true)
                .build();

        CaseSearchRequest caseSearchRequest = CaseSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(List.of(caseCriteria))
                .build();
        JsonNode courtCase = caseUtil.searchCaseDetails(caseSearchRequest);
        String cmpNumber = courtCase.path("cmpNumber").asText(null);
        String courtCaseNumber = courtCase.path("courtCaseNumber").asText(null);

        SmsTemplateData smsTemplateData = SmsTemplateData.builder()
                .tenantId(request.getDigitalizedDocument().getTenantId())
                .courtCaseNumber(courtCaseNumber)
                .cmpNumber(cmpNumber)
                .shortenedUrl(request.getDigitalizedDocument().getShortenedUrl())
                .build();

        String mobileNumber = Optional.ofNullable(request.getDigitalizedDocument())
                .map(DigitalizedDocument::getExaminationOfAccusedDetails)
                .map(ExaminationOfAccusedDetails::getAccusedMobileNumber)
                .orElse(null);

        JsonNode representatives = courtCase.path("representatives");

        Individual accusedIndividual = individualUtil.getIndividualFromMobileNumber(requestInfo,mobileNumber);

        String accusedIndividualId = accusedIndividual.getIndividualId();

        if (representatives != null && representatives.isArray()) {
            for (JsonNode representative : representatives) {

                JsonNode representingLitigants = representative.path("representing");

                if (representingLitigants != null && representingLitigants.isArray()) {
                    for (JsonNode representing : representingLitigants) {

                        String individualId = representing.path("individualId").asText();

                        if (accusedIndividualId.equalsIgnoreCase(individualId)) {

                            // ✅ Get representative's UUID (correct person)
                            String representativeUuid = representative
                                    .path("additionalDetails")
                                    .path("uuid")
                                    .asText();

                            String advocateMobileNumber = extractMobileNumberFromIndividual(
                                    representativeUuid,
                                    request.getDigitalizedDocument().getTenantId()
                            );

                            if (advocateMobileNumber != null && !advocateMobileNumber.isEmpty()) {
                                notificationService.sendNotification(
                                        requestInfo,
                                        smsTemplateData,
                                        CLIENT_EXAMINATION_ESIGN,
                                        advocateMobileNumber
                                );
                            }

                            break;
                        }
                    }
                }
            }
        }
    }

    private String extractMobileNumberFromIndividual(String uuid,String tenantId) {
        try {
            // Get RequestInfo from current context or create a new one
            RequestInfo requestInfo = RequestInfo.builder()
                    .build();
            
            // Get individual details using individualId
            List<Individual> individuals = individualUtil.getIndividuals(requestInfo, List.of(uuid), tenantId);
            
            if (!individuals.isEmpty()) {
                Individual individual = individuals.get(0);
                return individual.getMobileNumber();
            }
        } catch (Exception e) {
            log.error("Error fetching mobile number for uuid: {}", uuid, e);
        }
        return null;
    }

    public List<String> extractInactiveFileStoreIds(
            DigitalizedDocumentRequest digitalizedDocumentRequest,
            DigitalizedDocument existingDocument) {

        List<String> inactiveFileStoreIds = new ArrayList<>();

        DigitalizedDocument updatedDocument = digitalizedDocumentRequest.getDigitalizedDocument();

        // Collect filestoreIds present in updated document
        Set<String> updatedFileStores = new HashSet<>();
        if (updatedDocument.getDocuments() != null) {
            updatedDocument.getDocuments().stream()
                    .filter(Objects::nonNull)
                    .map(Document::getFileStore)
                    .filter(Objects::nonNull)
                    .forEach(updatedFileStores::add);
        }

        // Compare with existing document → extract filestores missing from updatedDocument
        if (existingDocument.getDocuments() != null) {
            existingDocument.getDocuments().stream()
                    .filter(Objects::nonNull)
                    .map(Document::getFileStore)
                    .filter(Objects::nonNull)
                    .filter(fs -> !updatedFileStores.contains(fs))   // filestore removed in updated payload
                    .forEach(inactiveFileStoreIds::add);
        }

        return inactiveFileStoreIds;
    }

}
