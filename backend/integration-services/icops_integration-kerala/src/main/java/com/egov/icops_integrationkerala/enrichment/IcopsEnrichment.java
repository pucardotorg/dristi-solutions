package com.egov.icops_integrationkerala.enrichment;

import com.egov.icops_integrationkerala.config.IcopsConfiguration;
import com.egov.icops_integrationkerala.model.*;
import com.egov.icops_integrationkerala.repository.IcopsRepository;
import com.egov.icops_integrationkerala.util.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.models.Document;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

import static com.egov.icops_integrationkerala.config.ServiceConstants.*;

@Component
@Slf4j
public class IcopsEnrichment {

    private final FileStorageUtil fileStorageUtil;

    private final IcopsConfiguration config;

    private final DateStringConverter converter;
    private final MdmsUtil util;

    private final IdgenUtil idgenUtil;

    private final IcopsRepository repository;

    private final ObjectMapper objectMapper;


    @Autowired
    public IcopsEnrichment(FileStorageUtil fileStorageUtil, IcopsConfiguration config,
                           DateStringConverter converter, MdmsUtil util, IdgenUtil idgenUtil, IcopsRepository repository, ObjectMapper objectMapper) {
        this.fileStorageUtil = fileStorageUtil;
        this.config = config;
        this.converter = converter;
        this.util = util;
        this.idgenUtil = idgenUtil;
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    public ProcessRequest getProcessRequest(TaskRequest taskRequest) throws JsonProcessingException {
        Task task = taskRequest.getTask();
        RequestInfo requestInfo = taskRequest.getRequestInfo();
        TaskDetails taskDetails = task.getTaskDetails();
        String fileStoreId = task.getDocuments().get(0).getFileStore();
        Map<String, Map<String, JSONArray>> mdmsData = util.fetchMdmsData(requestInfo, config.getEgovStateTenantId(),
                config.getIcopsBusinessServiceName(), createMasterDetails());
        String docFileString = fileStorageUtil.getFileFromFileStoreService(fileStoreId, config.getEgovStateTenantId());
        String processUniqueId = idgenUtil.getIdList(taskRequest.getRequestInfo(), config.getEgovStateTenantId(),
                config.getIdName(),null,1).get(0);
        ProcessRequest processRequest;
        if(!task.getTaskType().isEmpty() && (task.getTaskType().equalsIgnoreCase("WARRANT") ||
                task.getTaskType().equalsIgnoreCase("PROCLAMATION") ||
                task.getTaskType().equalsIgnoreCase("ATTACHMENT"))
        ){
            String docSubType = null;
            Long issueDate = null;
            String partyType = null;

            switch (task.getTaskType().toUpperCase()) {
                case "WARRANT":
                    docSubType = Optional.ofNullable(taskDetails.getWarrantDetails().getDocSubType())
                            .orElse("Warrant of arrest");
                    issueDate = taskDetails.getWarrantDetails().getIssueDate();
                    partyType = taskDetails.getWarrantDetails().getPartyType();
                    break;
                case "PROCLAMATION":
                    docSubType = Optional.ofNullable(taskDetails.getProclamationDetails().getDocSubType())
                            .orElse("Proclamation requiring the appearance of a person accused");
                    issueDate = taskDetails.getProclamationDetails().getIssueDate();
                    break;
                case "ATTACHMENT":
                    docSubType = Optional.ofNullable(taskDetails.getAttachmentDetails().getDocSubType())
                            .orElse("Order authorising an attachment by the district magistrate or collector");
                    issueDate = taskDetails.getAttachmentDetails().getIssueDate();
                    break;
            }
            Integer age = taskDetails.getRespondentDetails().getAge();
            String ageString = (age != null) ? String.valueOf(age) : "";

            Map<String, String> docTypeInfo = getDocTypeCode(mdmsData, docSubType);
            PartyData partyData = PartyData.builder()
                    .spartyAge(ageString)
                    .spartyName(taskDetails.getRespondentDetails().getName())
                    .spartyType("A")  // currently supported only for accused, so hardcoded it.
                    .spartyEmail(taskDetails.getRespondentDetails().getEmail())
                    .spartyState(taskDetails.getRespondentDetails().getState())
                    .spartyGender(taskDetails.getRespondentDetails().getGender())
                    .spartyMobile(taskDetails.getRespondentDetails().getPhone())
                    .spartyAddress(taskDetails.getRespondentDetails().getAddress().toString())
                    .spartyDistrict(taskDetails.getRespondentDetails().getDistrict())
                    .spartyRelationName(taskDetails.getRespondentDetails().getRelativeName())
                    .spartyRelationType(taskDetails.getRespondentDetails().getRelationWithRelative())
                    .build();
             processRequest = ProcessRequest.builder()
                    .partyData(partyData)
                     .processReceiverAddress(taskDetails.getRespondentDetails().getAddress().toString())
                     .processRespondantType("A")
                     .processRespondentName(taskDetails.getRespondentDetails().getName())
                    .processCaseno(task.getFilingNumber())
                    .processDoc(docFileString)
                    .processUniqueId(processUniqueId)
                    .processCourtName(taskDetails.getCaseDetails().getCourtName())
                    .processJudge(taskDetails.getCaseDetails().getJudgeName())
                    .processIssueDate(converter.convertLongToDate(issueDate))
                    .processNextHearingDate(converter.convertLongToDate(taskDetails.getCaseDetails().getHearingDate()))
                    .processPartyType(partyType)
                    .processDocType(docTypeInfo != null ? docTypeInfo.get("name") : null)
                    .processDocTypeCode(docTypeInfo != null ? docTypeInfo.get(DOC_TYPE_CODE) : null)
                    .processDocSubType(docTypeInfo != null ? docTypeInfo.get(SUB_TYPE) : null)
                    .processDocSubTypeCode(docTypeInfo != null ? docTypeInfo.get("code") : null)
                    .processCino(task.getCnrNumber())
                    .cnrNo(task.getCnrNumber())
                    .orderSignedDate(converter.convertLongToDate(task.getCreatedDate()))
                    .processOrigin(config.getProcessOrigin())
                    .processInvAgency(config.getProcessInvAgency())
                    .processCourtCode(taskDetails.getCaseDetails().getCourtId())
                    .build();
        }
        else{
            String docSubType = Optional.ofNullable(taskDetails.getSummonDetails().getDocSubType())
                    .orElse("Summons to an accused person");

            ProcessPersonDetails personDetails = extractPersonDetails(taskDetails);

            Integer age = personDetails.getAge();
            String ageString = (age != null) ? String.valueOf(age) : "";

            Map<String, String> docTypeInfo = getDocTypeCode(mdmsData, docSubType);
            processRequest = ProcessRequest.builder()
                    .processCaseno(task.getFilingNumber())
                    .processDoc(docFileString)
                    .processUniqueId(processUniqueId)
                    .processCourtName(taskDetails.getCaseDetails().getCourtName())
                    .processJudge(taskDetails.getCaseDetails().getJudgeName())
                    .processIssueDate(converter.convertLongToDate(taskDetails.getSummonDetails().getIssueDate()))
                    .processNextHearingDate(converter.convertLongToDate(taskDetails.getCaseDetails().getHearingDate()))
                    .processRespondentName(personDetails.getName())
                    .processRespondentGender(personDetails.getGender())
                    .processRespondentAge(ageString)
                    .processRespondentRelativeName(personDetails.getRelativeName())
                    .processRespondentRelation(personDetails.getRelationWithRelative())
                    .processReceiverAddress(personDetails.getAddress().toString())
                    .processReceiverState(personDetails.getState())
                    .processReceiverDistrict(personDetails.getDistrict())
                    .processReceiverPincode(personDetails.getPinCode())
                    .processPartyType(taskDetails.getSummonDetails().getPartyType())
                    .processDocType(docTypeInfo != null ? docTypeInfo.get("name") : null)
                    .processDocTypeCode(docTypeInfo != null ? docTypeInfo.get(DOC_TYPE_CODE) : null)
                    .processDocSubType(docTypeInfo != null ? docTypeInfo.get(SUB_TYPE) : null)
                    .processDocSubTypeCode(docTypeInfo != null ? docTypeInfo.get("code") : null)
                    .processCino(task.getCnrNumber())
                    .cnrNo(task.getCnrNumber())
                    .orderSignedDate(converter.convertLongToDate(task.getCreatedDate()))
                    .processOrigin(config.getProcessOrigin())
                    .processInvAgency(config.getProcessInvAgency())
                    .processRespondantType(taskDetails.getWitnessDetails() != null ? "W" : "A")
                    .processCourtCode(taskDetails.getCaseDetails().getCourtId())
                    .build();
        }

        return processRequest;
    }

    private ProcessPersonDetails extractPersonDetails(TaskDetails taskDetails) {
        if (taskDetails.getWitnessDetails() != null) {
            WitnessDetails witness = taskDetails.getWitnessDetails();
            return ProcessPersonDetails.builder()
                    .name(witness.getName())
                    .gender(witness.getGender())
                    .age(witness.getAge())
                    .relativeName(witness.getRelativeName())
                    .relationWithRelative(witness.getRelationWithRelative())
                    .address(witness.getAddress())
                    .state(witness.getState())
                    .district(witness.getDistrict())
                    .pinCode(witness.getPinCode())
                    .build();
        } else {
            RespondentDetails respondent = taskDetails.getRespondentDetails();
            return ProcessPersonDetails.builder()
                    .name(respondent.getName())
                    .gender(respondent.getGender())
                    .age(respondent.getAge())
                    .relativeName(respondent.getRelativeName())
                    .relationWithRelative(respondent.getRelationWithRelative())
                    .address(respondent.getAddress())
                    .state(respondent.getState())
                    .district(respondent.getDistrict())
                    .pinCode(respondent.getPinCode())
                    .build();
        }
    }


    public IcopsTracker createIcopsTrackerBody(TaskRequest request, ProcessRequest processRequest, ChannelMessage channelMessage, DeliveryStatus status) {
        String currentDate = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));

        return IcopsTracker.builder()
                .processNumber(processRequest.getProcessUniqueId())
                .tenantId(config.getEgovStateTenantId())
                .taskNumber(request.getTask().getTaskNumber())
                .taskType(request.getTask().getTaskType())
                .fileStoreId(getFileStore(request))
                .taskDetails(request.getTask().getTaskDetails())
                .deliveryStatus(status)
                .remarks(channelMessage.getFailureMsg())
                .rowVersion(0)
                .bookingDate(currentDate)
                .acknowledgementId(channelMessage.getAcknowledgeUniqueNumber())
                .requestBlob(processRequest)
                .build();
    }

    private String getFileStore(TaskRequest request) {
        if(request.getTask().getDocuments() == null || request.getTask().getDocuments().isEmpty()){
            return null;
        }
        String taskType = request.getTask().getTaskType();
        String documentTypeToUse = (WARRANT.equalsIgnoreCase(taskType) || PROCLAMATION.equalsIgnoreCase(taskType) || ATTACHMENT.equalsIgnoreCase(taskType)) ? SIGNED_TASK_DOCUMENT : SEND_TASK_DOCUMENT;
        return request.getTask().getDocuments().stream()
                .filter(document -> document.getDocumentType() != null)
                .filter(document -> document.getDocumentType().equalsIgnoreCase(documentTypeToUse))
                .findFirst()
                .map(Document::getFileStore)
                .orElse(null);
    }

    public IcopsTracker enrichIcopsTrackerForUpdate(IcopsProcessReport icopsProcessReport) throws ProcessReportException {
        List<IcopsTracker> icopsTrackers = repository.getIcopsTracker(icopsProcessReport.getProcessUniqueId());
        if (icopsTrackers.size() != 1) {
            log.error("Process Unique Id is not valid {}", icopsProcessReport.getProcessUniqueId());
            throw new ProcessReportException("ProcessUniqueId is either null or not valid");
        }
        IcopsTracker icopsTracker = icopsTrackers.get(0);

        icopsTracker.setAdditionalDetails(convertProcessReportData(icopsProcessReport));
        return icopsTracker;
    }

    private AdditionalFields convertProcessReportData(IcopsProcessReport icopsProcessReport) {
        AdditionalFields additionalFields = new AdditionalFields();
        log.info("IcopsProcessReport : {}", icopsProcessReport);
        List<Field> fieldsList = new ArrayList<>();
        if (icopsProcessReport.getProcessUniqueId() != null) {
            fieldsList.add(new Field("processUniqueId", icopsProcessReport.getProcessUniqueId()));
        }
        if (icopsProcessReport.getProcessCourtCode() != null) {
            fieldsList.add(new Field("processCourtCode", icopsProcessReport.getProcessCourtCode()));
        }
        if (icopsProcessReport.getProcessActionDate() != null) {
            fieldsList.add(new Field("processActionDate", icopsProcessReport.getProcessActionDate()));
        }
        if (icopsProcessReport.getProcessActionStatusCd() != null) {
            fieldsList.add(new Field("processActionStatusCd", icopsProcessReport.getProcessActionStatusCd()));
        }
        if (icopsProcessReport.getProcessActionStatus() != null) {
            fieldsList.add(new Field("processActionStatus", icopsProcessReport.getProcessActionStatus()));
        }
        if (icopsProcessReport.getProcessActionSubStatusCd() != null) {
            fieldsList.add(new Field("processActionSubStatusCd", icopsProcessReport.getProcessActionSubStatusCd()));
        }
        if (icopsProcessReport.getProcessActionSubStatus() != null) {
            fieldsList.add(new Field("processActionSubStatus", icopsProcessReport.getProcessActionSubStatus()));
        }
        if (icopsProcessReport.getProcessFailureReason() != null) {
            fieldsList.add(new Field("processFailureReason", icopsProcessReport.getProcessFailureReason()));
        }
        if (icopsProcessReport.getProcessMethodOfExecution() != null) {
            fieldsList.add(new Field("processMethodOfExecution", icopsProcessReport.getProcessMethodOfExecution()));
        }
        if (icopsProcessReport.getProcessExecutedTo() != null) {
            fieldsList.add(new Field("processExecutedTo", icopsProcessReport.getProcessExecutedTo()));
        }
        if (icopsProcessReport.getProcessExecutedToRelation() != null) {
            fieldsList.add(new Field("processExecutedToRelation", icopsProcessReport.getProcessExecutedToRelation()));
        }
        if (icopsProcessReport.getProcessExecutionPlace() != null) {
            fieldsList.add(new Field("processExecutionPlace", icopsProcessReport.getProcessExecutionPlace()));
        }
        if (icopsProcessReport.getProcessActionRemarks() != null) {
            fieldsList.add(new Field("processActionRemarks", icopsProcessReport.getProcessActionRemarks()));
        }
        if (icopsProcessReport.getProcessExecutingOfficerName() != null) {
            fieldsList.add(new Field("processExecutingOfficerName", icopsProcessReport.getProcessExecutingOfficerName()));
        }
        if (icopsProcessReport.getProcessExecutingOfficerRank() != null) {
            fieldsList.add(new Field("processExecutingOfficerRank", icopsProcessReport.getProcessExecutingOfficerRank()));
        }
        if (icopsProcessReport.getProcessExecutingOfficeCode() != null) {
            fieldsList.add(new Field("processExecutingOfficeCode", icopsProcessReport.getProcessExecutingOfficeCode()));
        }
        if (icopsProcessReport.getProcessExecutingOffice() != null) {
            fieldsList.add(new Field("processExecutingOffice", icopsProcessReport.getProcessExecutingOffice()));
        }
        if (icopsProcessReport.getProcessSubmittingOfficerName() != null) {
            fieldsList.add(new Field("processSubmittingOfficerName", icopsProcessReport.getProcessSubmittingOfficerName()));
        }
        if (icopsProcessReport.getProcessSubmittingOfficerRank() != null) {
            fieldsList.add(new Field("processSubmittingOfficerRank", icopsProcessReport.getProcessSubmittingOfficerRank()));
        }
        if (icopsProcessReport.getProcessSubmittingOfficeCode() != null) {
            fieldsList.add(new Field("processSubmittingOfficeCode", icopsProcessReport.getProcessSubmittingOfficeCode()));
        }
        if (icopsProcessReport.getProcessSubmittingOffice() != null) {
            fieldsList.add(new Field("processSubmittingOffice", icopsProcessReport.getProcessSubmittingOffice()));
        }
        if (icopsProcessReport.getProcessReportSubmittingDateTime() != null) {
            fieldsList.add(new Field("processReportSubmittingDateTime", icopsProcessReport.getProcessReportSubmittingDateTime()));
        }
        if (icopsProcessReport.getProcessReport() != null) {
            byte[] decodedBytes = Base64.getDecoder().decode(icopsProcessReport.getProcessReport());
            String filePath = "file.pdf";

            // Write the byte array to a PDF file
            try (OutputStream os = new FileOutputStream(filePath)) {
                os.write(decodedBytes);
                String fileStoreId = fileStorageUtil.saveDocumentToFileStore(filePath);
                fieldsList.add(new Field("policeReportFileStoreId", fileStoreId));
            } catch (IOException e) {
                log.error("Error occurred when generating file from base64 string", e);
                throw new ProcessReportException("Failed to generate file from base64 string");
            } finally {
                File file = new File(filePath);
                if (file.exists() && file.isFile()) {
                    file.delete();
                }
            }
        }
        additionalFields.setFields(fieldsList);
        return additionalFields;
    }


    private List<String> createMasterDetails() {
        List<String> masterList = new ArrayList<>();
        masterList.add("docType");
        masterList.add(DOC_SUB_TYPE);
        masterList.add("actionStatus");
        return masterList;
    }
    public Map<String, String> getDocTypeCode(Map<String, Map<String, JSONArray>> mdmsData, String masterString) {

        if (mdmsData != null && mdmsData.containsKey(config.getIcopsBusinessServiceName()) && mdmsData.get(config.getIcopsBusinessServiceName()).containsKey(DOC_SUB_TYPE)) {
            JSONArray docSubType = mdmsData.get(config.getIcopsBusinessServiceName()).get(DOC_SUB_TYPE);
            JSONArray docsType = mdmsData.get(config.getIcopsBusinessServiceName()).get("docType");
            Map<String, String> result = new HashMap<>();
            for (Object docSubTypeObj : docSubType) {
                Map<String, String> subType = (Map<String, String>) docSubTypeObj;
                if (masterString.equals(subType.get("name"))) {
                    result.put("code", subType.get("code"));
                    result.put(DOC_TYPE_CODE, subType.get(DOC_TYPE_CODE));
                    result.put(SUB_TYPE,subType.get(SUB_TYPE));
                }
            }
            for (Object docTypeObj : docsType) {
                Map<String, String> docType = (Map<String, String>) docTypeObj;
                if (result.get(DOC_TYPE_CODE) != null && result.get(DOC_TYPE_CODE).equals(docType.get("code"))) {
                    result.put("name", docType.get("type"));
                    return result;
                }
            }
        }
        return Collections.emptyMap();
    }
}
