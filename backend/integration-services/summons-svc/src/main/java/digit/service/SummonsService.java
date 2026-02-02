package digit.service;

import com.fasterxml.jackson.databind.JsonNode;
import digit.config.Configuration;
import digit.enrichment.SummonsDeliveryEnrichment;
import digit.kafka.Producer;
import digit.repository.SummonsRepository;
import digit.util.*;
import digit.web.models.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.models.Document;
import org.egov.common.contract.models.Workflow;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;

import java.util.*;

import static digit.config.ServiceConstants.*;

@Service
@Slf4j
public class SummonsService {


    private final PdfServiceUtil pdfServiceUtil;

    private final Configuration config;

    private final FileStorageUtil fileStorageUtil;

    private final SummonsRepository summonsRepository;

    private final Producer producer;

    private final SummonsDeliveryEnrichment summonsDeliveryEnrichment;

    private final ExternalChannelUtil externalChannelUtil;

    private final TaskUtil taskUtil;

    private final CaseManagementUtil caseManagementUtil;

    private final MdmsUtil mdmsUtil;

    private final CaseUtil caseUtil;

    private final EvidenceUtil evidenceUtil;

    @Autowired
    public SummonsService(PdfServiceUtil pdfServiceUtil, Configuration config, Producer producer,
                          FileStorageUtil fileStorageUtil, SummonsRepository summonsRepository,
                          SummonsDeliveryEnrichment summonsDeliveryEnrichment, ExternalChannelUtil externalChannelUtil,
                          TaskUtil taskUtil, CaseManagementUtil caseManagementUtil, MdmsUtil mdmsUtil, CaseUtil caseUtil, EvidenceUtil evidenceUtil) {
        this.pdfServiceUtil = pdfServiceUtil;
        this.config = config;
        this.producer = producer;
        this.fileStorageUtil = fileStorageUtil;
        this.summonsRepository = summonsRepository;
        this.summonsDeliveryEnrichment = summonsDeliveryEnrichment;
        this.externalChannelUtil = externalChannelUtil;
        this.taskUtil = taskUtil;
        this.caseManagementUtil = caseManagementUtil;
        this.mdmsUtil = mdmsUtil;
        this.caseUtil = caseUtil;
        this.evidenceUtil = evidenceUtil;
    }

    public TaskResponse generateSummonsDocument(TaskRequest taskRequest) {
        String taskType = taskRequest.getTask().getTaskType();
        String docSubType = getDocSubType(taskType, taskRequest.getTask().getTaskDetails());
        String templateType = getTemplateType(taskType, taskRequest.getTask().getTaskDetails());
        String noticeType = getNoticeType(taskRequest.getTask().getTaskDetails());
        Task task = taskRequest.getTask();
        String deliveryChannel = (task != null &&
                task.getTaskDetails() != null &&
                task.getTaskDetails().getDeliveryChannel() != null)
                ? task.getTaskDetails().getDeliveryChannel().getChannelName()
                : null;
        String pdfTemplateKey = getPdfTemplateKey(taskType, docSubType, false, noticeType, templateType);

        if (E_POST.equalsIgnoreCase(deliveryChannel)) {
            pdfTemplateKey = pdfTemplateKey + "-e-post";
        }

        return generateDocumentAndUpdateTask(taskRequest, pdfTemplateKey, false);
    }

    private String getTemplateType(String taskType, TaskDetails taskDetails) {
        if(WARRANT.equals(taskType)){
            return taskDetails.getWarrantDetails() != null ? taskDetails.getWarrantDetails().getTemplateType() : null;
        } else if(PROCLAMATION.equals(taskType)){
            return taskDetails.getProclamationDetails() != null ? taskDetails.getProclamationDetails().getTemplateType() : null;
        } else if(ATTACHMENT.equals(taskType)){
            return taskDetails.getAttachmentDetails() != null ? taskDetails.getAttachmentDetails().getTemplateType() : null;
        }
        return null; // For other task types, templateType is not applicable
    }

    private String getNoticeType(TaskDetails taskDetails) {
        return taskDetails.getNoticeDetails() != null ? taskDetails.getNoticeDetails().getNoticeType() : null;
    }

    private TaskResponse generateDocumentAndUpdateTask(TaskRequest taskRequest, String pdfTemplateKey, boolean qrCode) {
        ByteArrayResource byteArrayResource = pdfServiceUtil.generatePdfFromPdfService(taskRequest,
                taskRequest.getTask().getTenantId(), pdfTemplateKey, qrCode);
        String fileStoreId = fileStorageUtil.saveDocumentToFileStore(byteArrayResource);

        Document document = createDocument(fileStoreId, qrCode);
        taskRequest.getTask().addDocumentsItem(document);

        return taskUtil.callUploadDocumentTask(taskRequest);
    }

    private TaskResponse generateMiscellaneousDocumentAndUpdateTask(TaskRequest taskRequest, boolean qrCode) {
        ByteArrayResource byteArrayResource = pdfServiceUtil.generatePdfFromEgovPdfService(taskRequest,
                taskRequest.getTask().getTenantId(), taskRequest.getTask().getCourtId());
        String fileStoreId = fileStorageUtil.saveDocumentToFileStore(byteArrayResource);

        Document document = createDocument(fileStoreId, qrCode);
        taskRequest.getTask().addDocumentsItem(document);

        return taskUtil.callUploadDocumentTask(taskRequest);
    }

    public SummonsDelivery sendSummonsViaChannels(TaskRequest request) {

        TaskCriteria taskCriteria = TaskCriteria.builder().taskNumber(request.getTask().getTaskNumber()).build();
        TaskSearchRequest searchRequest = TaskSearchRequest.builder()
                .requestInfo(request.getRequestInfo()).criteria(taskCriteria).build();
        TaskListResponse taskListResponse = taskUtil.callSearchTask(searchRequest);
        Task task = taskListResponse.getList().get(0);
        String taskType = task.getTaskType();
        TaskRequest taskRequest = TaskRequest.builder()
                .task(task)
                .requestInfo(request.getRequestInfo()).build();

        if (!(MISCELLANEOUS_PROCESS.equalsIgnoreCase(taskType) || taskType.equalsIgnoreCase(WARRANT) || taskType.equalsIgnoreCase(PROCLAMATION) || taskType.equalsIgnoreCase(ATTACHMENT))) {
            String docSubType = getDocSubType(taskType, task.getTaskDetails());
            String noticeType = getNoticeType(task.getTaskDetails());
            String pdfTemplateKey = getPdfTemplateKey(taskType, docSubType, true, noticeType, null);

            generateDocumentAndUpdateTask(taskRequest, pdfTemplateKey, true);
        }

        if (MISCELLANEOUS_PROCESS.equalsIgnoreCase(taskType)) {
            generateMiscellaneousDocumentAndUpdateTask(taskRequest,false);
        }

        SummonsDelivery summonsDelivery = summonsDeliveryEnrichment.generateAndEnrichSummonsDelivery(taskRequest.getTask(), taskRequest.getRequestInfo());

        ChannelMessage channelMessage = externalChannelUtil.sendSummonsByDeliveryChannel(taskRequest, summonsDelivery);

        if (SUCCESS.equalsIgnoreCase(channelMessage.getAcknowledgementStatus())) {
            summonsDelivery.setIsAcceptedByChannel(Boolean.TRUE);
            if (summonsDelivery.getChannelName() == ChannelName.SMS || summonsDelivery.getChannelName() == ChannelName.EMAIL) {
                summonsDelivery.setDeliveryStatus(DeliveryStatus.DELIVERED);
            } else {
                summonsDelivery.setDeliveryStatus(DeliveryStatus.NOT_UPDATED);
            }
            summonsDelivery.setChannelAcknowledgementId(channelMessage.getAcknowledgeUniqueNumber());
        }
        SummonsRequest summonsRequest = createSummonsRequest(request.getRequestInfo(), summonsDelivery);

        producer.push(config.getInsertSummonsTopic(), summonsRequest);
        return summonsDelivery;
    }

    public List<SummonsDelivery> getSummonsDelivery(SummonsDeliverySearchRequest request) {
        return getSummonsDeliveryFromSearchCriteria(request.getSearchCriteria());
    }

    public ChannelMessage updateSummonsDeliveryStatus(UpdateSummonsRequest request) {
        SummonsDelivery summonsDelivery = fetchSummonsDelivery(request);

        enrichAndUpdateSummonsDelivery(summonsDelivery, request);

        SummonsRequest summonsRequest = createSummonsRequest(request.getRequestInfo(), summonsDelivery);
        producer.push(config.getUpdateSummonsTopic(), summonsRequest);

        return createChannelMessage(summonsDelivery);
    }

    private void enrichAndUpdateSummonsDelivery(SummonsDelivery summonsDelivery, UpdateSummonsRequest request) {
        summonsDeliveryEnrichment.enrichForUpdate(summonsDelivery, request.getRequestInfo());
        ChannelReport channelReport = request.getChannelReport();
        summonsDelivery.setDeliveryStatus(channelReport.getDeliveryStatus());
        summonsDelivery.setAdditionalFields(channelReport.getAdditionalFields());
    }

    public void updateTaskStatus(SummonsRequest request) {
        TaskCriteria taskCriteria = TaskCriteria.builder().taskNumber(request.getSummonsDelivery().getTaskNumber()).build();
        TaskSearchRequest searchRequest = TaskSearchRequest.builder()
                .requestInfo(request.getRequestInfo()).criteria(taskCriteria).build();
        TaskListResponse taskListResponse = taskUtil.callSearchTask(searchRequest);
        Task task = taskListResponse.getList().get(0);
        Workflow workflow = null;
        if (task.getTaskType().equalsIgnoreCase(SUMMON)) {
            if (request.getSummonsDelivery().getDeliveryStatus().equals(DeliveryStatus.DELIVERED)) {
                workflow = Workflow.builder().action("SERVED").build();
            } else if (request.getSummonsDelivery().getDeliveryStatus().equals(DeliveryStatus.IN_TRANSIT)) {
                workflow = Workflow.builder().action("TRANSIT").build();
            } else if (request.getSummonsDelivery().getDeliveryStatus().equals(DeliveryStatus.DELIVERED_ICOPS)) {
                workflow = Workflow.builder().action("DELIVERED").build();
            } else if (request.getSummonsDelivery().getDeliveryStatus().equals(DeliveryStatus.NOT_DELIVERED_ICOPS)) {
                workflow = Workflow.builder().action("NOT_DELIVERED").build();
            }else {
                workflow = Workflow.builder().action("NOT_SERVED").build();
            }
        } else if (task.getTaskType().equalsIgnoreCase(WARRANT) || task.getTaskType().equalsIgnoreCase(PROCLAMATION) || task.getTaskType().equalsIgnoreCase(ATTACHMENT) ) {
            if (request.getSummonsDelivery().getDeliveryStatus().equals(DeliveryStatus.DELIVERED)) {
            workflow = Workflow.builder().action("DELIVERED").build();
            } else if (request.getSummonsDelivery().getDeliveryStatus().equals(DeliveryStatus.IN_TRANSIT)) {
                workflow = Workflow.builder().action("TRANSIT").build();
            }
            else if (request.getSummonsDelivery().getDeliveryStatus().equals(DeliveryStatus.DELIVERED_ICOPS)) {
                workflow = Workflow.builder().action("DELIVERED").build();
            } else if (request.getSummonsDelivery().getDeliveryStatus().equals(DeliveryStatus.NOT_DELIVERED_ICOPS)) {
                workflow = Workflow.builder().action("NOT_DELIVERED").build();
            }
            else {
                workflow = Workflow.builder().action("NOT_SERVED").build();
            }
        } else if (task.getTaskType().equalsIgnoreCase(NOTICE)) {
            if (request.getSummonsDelivery().getDeliveryStatus().equals(DeliveryStatus.DELIVERED)) {
                workflow = Workflow.builder().action("SERVED").build();
            } else {
                workflow = Workflow.builder().action("NOT_SERVED").build();
            }
        }
        task.setWorkflow(workflow);
        enrichPoliceStationReport(task, request.getSummonsDelivery());
        Role role = Role.builder().code(config.getSystemAdmin()).tenantId(config.getEgovStateTenantId()).build();
        request.getRequestInfo().getUserInfo().getRoles().add(role);
        TaskRequest taskRequest = TaskRequest.builder()
                .requestInfo(request.getRequestInfo()).task(task).build();
        taskUtil.callUpdateTask(taskRequest);

        List<Document> documents = Optional.ofNullable(task.getDocuments())
                .orElse(Collections.emptyList())
                .stream().filter(doc -> POLICE_REPORT.equals(doc.getDocumentType()))
                .toList();
        if (!documents.isEmpty()) {
            createEvidenceForPoliceReport(taskRequest, documents.get(0));
        }
    }

    public void createEvidenceForPoliceReport(TaskRequest taskRequest, Document document) {
        try {
            Artifact artifact = Artifact.builder()
                    .artifactType(getArtifactType(taskRequest.getRequestInfo(), taskRequest.getTask()))
                    .caseId(getCaseId(taskRequest))
                    .filingNumber(taskRequest.getTask().getFilingNumber())
                    .tenantId(taskRequest.getTask().getTenantId())
                    .comments(new ArrayList<>())
                    .file(document)
                    .sourceType(ICOPS)
                    .sourceID(taskRequest.getRequestInfo().getUserInfo().getUuid())
                    .filingType(getFilingType(taskRequest.getRequestInfo(), taskRequest.getTask()))
                    .isEvidence(true)
                    .additionalDetails(getAdditionalDetails(taskRequest.getRequestInfo()))
                    .build();

            EvidenceRequest evidenceRequest = EvidenceRequest.builder()
                    .requestInfo(taskRequest.getRequestInfo())
                    .artifact(artifact)
                    .build();
            evidenceUtil.createEvidence(evidenceRequest);
        } catch (Exception e) {
            log.error("Error while creating evidence for police report: {}", document);
        }
    }

    private String getFilingType(@Valid RequestInfo requestInfo, @Valid Task task) {
        Map<String, Map<String, JSONArray>> mdmsData = mdmsUtil.fetchMdmsData(requestInfo, task.getTenantId(), "common-masters", Collections.singletonList("FilingType"));
        JSONArray filingTypeArray = mdmsData.get("common-masters").get("FilingType");
        for (Object o : filingTypeArray) {
            Map<String, Object> filingType = (Map<String, Object>) o;
            //todo : check for filing type if changed
            if (filingType.get("code").toString().equalsIgnoreCase(DIRECT)) {
                return (String) filingType.get("code");
            }
        }
        return null;
    }

    private @NotNull String getCaseId(TaskRequest taskRequest) {
        CaseSearchRequest caseSearchRequest = CaseSearchRequest.builder()
                .requestInfo(taskRequest.getRequestInfo())
                .criteria(List.of(CaseCriteria.builder()
                        .filingNumber(taskRequest.getTask().getFilingNumber())
                        .defaultFields(false)
                        .build()))
                .build();
        JsonNode courtCase = caseUtil.searchCaseDetails(caseSearchRequest);
        return courtCase.get("id").textValue();
    }

    private Object getAdditionalDetails(@Valid RequestInfo requestInfo) {
        return Map.of("uuid", requestInfo.getUserInfo().getUuid());
    }

    private String getArtifactType(@Valid RequestInfo requestInfo, @Valid Task task) {
        Map<String, Map<String, JSONArray>> mdmsData = mdmsUtil.fetchMdmsData(requestInfo, task.getTenantId(), "Evidence", Collections.singletonList("EvidenceType"));
        JSONArray evidenceTypeArray = mdmsData.get("Evidence").get("EvidenceType");
        for (Object o : evidenceTypeArray) {
            Map<String, Object> evidenceType = (Map<String, Object>) o;
            if (evidenceType.get("type").toString().equalsIgnoreCase(POLICE_REPORT)) {
                return (String) evidenceType.get("type");
            }
        }
        return null;
    }

    private void enrichPoliceStationReport(Task task, @Valid SummonsDelivery summonsDelivery) {
        String fileStoreId = extractFileStoreId(summonsDelivery);
        if (fileStoreId != null) {
            Document document = Document.builder()
                    .fileStore(fileStoreId)
                    .documentType(POLICE_REPORT)
                    .additionalDetails(AdditionalFields.builder().fields(Collections.emptyList()).build())
                    .build();
            task.addDocumentsItem(document);
        } else {
            log.error("Police Report not found for the task of type : {} and number : {}", task.getTaskType(), task.getTaskNumber());
        }
    }

    private String extractFileStoreId(@Valid SummonsDelivery summonsDelivery) {
        AdditionalFields additionalFields = summonsDelivery.getAdditionalFields();
        return Optional.ofNullable(additionalFields)
                .map(AdditionalFields::getFields)
                .flatMap(fields -> fields.stream()
                        .filter(field -> field.getKey().equalsIgnoreCase("policeReportFileStoreId"))
                        .map(Field::getValue)
                        .findFirst())
                .orElse(null);
    }

    private String getPdfTemplateKey(String taskType, String docSubType, boolean qrCode, String noticeType, String templateType) {
        switch (taskType) {
            case SUMMON -> {
                if (ACCUSED.equals(docSubType)) {
                    return qrCode ? config.getSummonsAccusedQrPdfTemplateKey() : config.getSummonsAccusedPdfTemplateKey();
                } else if (WITNESS.equals(docSubType)) {
                    return qrCode ? config.getBailableWarrantPdfTemplateKey() : config.getSummonsIssuePdfTemplateKey();
                } else {
                    throw new CustomException("INVALID_DOC_SUB_TYPE", "Document Sub-Type must be valid. Provided: " + docSubType);
                }
            }
            case WARRANT -> {
                if (SPECIFIC.equals(templateType)) {
                    if (BAILABLE.equals(docSubType)) {
                        return config.getBailableWarrantPdfTemplateKey();
                    } else if (NON_BAILABLE.equals(docSubType)) {
                        return config.getNonBailableWarrantPdfTemplateKey();
                    } else {
                        throw new CustomException("INVALID_DOC_SUB_TYPE", "Document Sub-Type must be valid. Provided: " + docSubType);
                    }
                } else if (GENERIC.equals(templateType)) {
                    return config.getTaskWarrantGenericPdfTemplateKey();
                } else {
                    throw new CustomException("INVALID_TEMPLATE_TYPE", "Template Type must be valid. Provided: " + templateType);
                }
            }
            case PROCLAMATION -> {
                return config.getTaskProclamationGenericPdfTemplateKey();
            }
            case ATTACHMENT -> {
                return config.getTaskAttachmentGenericPdfTemplateKey();
            }
            case NOTICE -> {
                if(Objects.equals(noticeType, BNSS_NOTICE)){
                    return config.getTaskBnssNoticePdfTemplateKey();
                } else if(Objects.equals(noticeType, DCA_NOTICE)) {
                    return config.getTaskDcaNoticePdfTemplateKey();
                } else {
                    return qrCode ? config.getTaskNoticeQrPdfTemplateKey() : config.getTaskNotificationTemplateKey();
                }
            }
            default -> throw new CustomException("INVALID_TASK_TYPE", "Task Type must be valid. Provided: " + taskType);
        }
    }

    private String getDocSubType(String taskType, TaskDetails taskDetails) {
        if (taskDetails == null) {
            return null;
        }

        return switch (taskType) {
            case SUMMON -> taskDetails.getSummonDetails() != null ? taskDetails.getSummonDetails().getDocSubType() : null;
            case WARRANT -> taskDetails.getWarrantDetails() != null ? taskDetails.getWarrantDetails().getDocSubType() : null;
            case NOTICE -> taskDetails.getNoticeDetails() != null ? taskDetails.getNoticeDetails().getDocSubType() : null;
            case PROCLAMATION -> taskDetails.getProclamationDetails() != null ? taskDetails.getProclamationDetails().getDocSubType() : null;
            case ATTACHMENT -> taskDetails.getAttachmentDetails() != null ? taskDetails.getAttachmentDetails().getDocSubType() : null;
            default -> throw new CustomException("INVALID_TASK_TYPE", "Task Type must be valid. Provided: " + taskType);
        };
    }

    private SummonsDelivery fetchSummonsDelivery(UpdateSummonsRequest request) {
        SummonsDeliverySearchCriteria searchCriteria = SummonsDeliverySearchCriteria.builder()
                .taskNumber(request.getChannelReport().getTaskNumber())
                .build();
        Optional<SummonsDelivery> optionalSummons = getSummonsDeliveryFromSearchCriteria(searchCriteria).stream().findFirst();
        if (optionalSummons.isEmpty()) {
            throw new CustomException("SUMMONS_UPDATE_ERROR", "Invalid summons delivery id was provided");
        }
        return optionalSummons.get();
    }

    private List<SummonsDelivery> getSummonsDeliveryFromSearchCriteria(SummonsDeliverySearchCriteria searchCriteria) {
        return summonsRepository.getSummons(searchCriteria);
    }

    private Document createDocument(String fileStoreId, boolean qrCode) {
        String fileCategory = qrCode ? SEND_TASK_DOCUMENT : GENERATE_TASK_DOCUMENT;
        Field field = Field.builder().key(FILE_CATEGORY).value(fileCategory).build();
        AdditionalFields additionalFields = AdditionalFields.builder().fields(Collections.singletonList(field)).build();
        return Document.builder()
                .fileStore(fileStoreId)
                .documentType(fileCategory)
                .additionalDetails(additionalFields)
                .build();
    }

    private SummonsRequest createSummonsRequest(RequestInfo requestInfo, SummonsDelivery summonsDelivery) {
        return SummonsRequest.builder()
                .requestInfo(requestInfo)
                .summonsDelivery(summonsDelivery)
                .build();
    }

    private ChannelMessage createChannelMessage(SummonsDelivery summonsDelivery) {
        return ChannelMessage.builder()
                .acknowledgeUniqueNumber(summonsDelivery.getSummonDeliveryId())
                .acknowledgementStatus("SUCCESS")
                .build();
    }
}
