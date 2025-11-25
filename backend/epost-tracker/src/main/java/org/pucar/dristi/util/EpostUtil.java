package org.pucar.dristi.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Document;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.EPostConfiguration;
import org.pucar.dristi.config.MdmsDataConfig;
import org.pucar.dristi.model.*;
import org.pucar.dristi.repository.EPostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.pucar.dristi.config.ServiceConstants.*;
import static org.pucar.dristi.model.DeliveryStatus.BOOKED;

@Slf4j
@Component
public class EpostUtil {

    private final IdgenUtil idgenUtil;

    private final EPostConfiguration config;

    private final EPostRepository ePostRepository;

    private final ObjectMapper objectMapper;

    private final MdmsDataConfig mdmsDataConfig;

    @Autowired
    public EpostUtil(IdgenUtil idgenUtil, EPostConfiguration config, EPostRepository ePostRepository, ObjectMapper objectMapper, MdmsDataConfig mdmsDataConfig) {
        this.idgenUtil = idgenUtil;
        this.config = config;
        this.ePostRepository = ePostRepository;
        this.objectMapper = objectMapper;
        this.mdmsDataConfig = mdmsDataConfig;
    }

    public EPostTracker createPostTrackerBody(TaskRequest request) throws JsonProcessingException {
        String processNumber = idgenUtil.getIdList(request.getRequestInfo(), config.getEgovStateTenantId(),
                config.getIdName(),null,1).get(0);
        long currentDate = System.currentTimeMillis();

        ZoneId istZone = ZoneId.of("Asia/Kolkata");
        long istMillis = Instant.ofEpochMilli(currentDate)
                .atZone(istZone)
                .toInstant()
                .toEpochMilli();

        Task task = request.getTask();
        String docSubType = null;

        if (NOTICE.equals(task.getTaskType())) {
            docSubType = task.getTaskDetails().getNoticeDetails().getDocSubType();
        } else if (SUMMON.equals(task.getTaskType())) {
            docSubType = task.getTaskDetails().getSummonDetails().getDocSubType();
        }

        String respondentName = (docSubType != null && docSubType.equals(WITNESS)) ? task.getTaskDetails().getWitnessDetails().getName() : task.getTaskDetails().getRespondentDetails().getName();
        String respondentAddress = (docSubType != null && docSubType.equals(WITNESS)) ? task.getTaskDetails().getWitnessDetails().getAddress().toString() : task.getTaskDetails().getRespondentDetails().getAddress().toString();
        Address address = (docSubType != null && docSubType.equals(WITNESS)) ? task.getTaskDetails().getWitnessDetails().getAddress() : task.getTaskDetails().getRespondentDetails().getAddress();
        String phone = (docSubType != null && docSubType.equals(WITNESS)) ? task.getTaskDetails().getWitnessDetails().getPhone() : task.getTaskDetails().getRespondentDetails().getPhone();
        String pinCode = (docSubType != null && docSubType.equals(WITNESS)) ? task.getTaskDetails().getWitnessDetails().getAddress().getPinCode() : task.getTaskDetails().getRespondentDetails().getAddress().getPinCode();


        EPostTracker ePostTracker = EPostTracker.builder()
                .processNumber(processNumber)
                .tenantId(config.getEgovStateTenantId())
                .taskNumber(request.getTask().getTaskNumber())
                .totalAmount(getTotalAmount(request))
                .fileStoreId(getFileStore(request))
                .address(respondentAddress)
                .addressObj(address)
                .phone(phone)
                .pinCode(pinCode)
                .deliveryStatus(DeliveryStatus.NOT_UPDATED)
                .additionalDetails(request.getTask().getAdditionalDetails())
                .rowVersion(0)
                .receivedDate(istMillis)
                .taskType(request.getTask().getTaskType())
                .respondentName(respondentName)
                .auditDetails(createAuditDetails(request.getRequestInfo()))
                .build();

        enrichPostHub(ePostTracker);

        return ePostTracker;
    }

    private String getTotalAmount(TaskRequest request) {
        return request.getTask() != null
                && request.getTask().getTaskDetails() != null
                && request.getTask().getTaskDetails().getDeliveryChannels() != null
                && request.getTask().getTaskDetails().getDeliveryChannels().getFees() != null
                ? String.valueOf(request.getTask().getTaskDetails().getDeliveryChannels().getFees())
                : null;
    }

    private String getFileStore(TaskRequest request) {
        if(request.getTask().getDocuments() == null || request.getTask().getDocuments().isEmpty()){
            return null;
        }
        return request.getTask().getDocuments().stream()
            .filter(document -> document.getDocumentType() != null)
            .filter(document -> document.getDocumentType().equalsIgnoreCase(SEND_TASK_DOCUMENT))
            .findFirst()
            .map(Document::getFileStore)
            .orElse(null);
    }

    public EPostTracker updateEPostTracker(EPostRequest ePostRequest) {
        Pagination pagination = Pagination.builder().build();
        EPostTrackerSearchCriteria searchCriteria = EPostTrackerSearchCriteria.builder()
                .processNumber(ePostRequest.getEPostTracker().getProcessNumber()).pagination(pagination).build();
        List<EPostTracker> ePostTrackers = ePostRepository.getEPostTrackerList(searchCriteria,5,0);
        if (ePostTrackers.size() != 1) {
            throw new CustomException(EPOST_TRACKER_ERROR,INVALID_EPOST_TRACKER_FIELD + ePostRequest.getEPostTracker().getProcessNumber());
        }
        EPostTracker ePostTracker = ePostTrackers.get(0);

        if (ePostTracker.getPostalHub() == null) {
            enrichPostHub(ePostTracker);
        }

        Long currentTime = System.currentTimeMillis();
        ePostTracker.getAuditDetails().setLastModifiedTime(currentTime);
        ePostTracker.getAuditDetails().setLastModifiedBy(ePostRequest.getRequestInfo().getUserInfo().getUuid());
        ePostTracker.setRowVersion(ePostTracker.getRowVersion() + 1);

        ePostTracker.setTrackingNumber(ePostRequest.getEPostTracker().getTrackingNumber());
        ePostTracker.setDeliveryStatus(ePostRequest.getEPostTracker().getDeliveryStatus());
        ePostTracker.setRemarks(ePostRequest.getEPostTracker().getRemarks());
        ePostTracker.setTaskNumber(ePostRequest.getEPostTracker().getTaskNumber());
        ePostTracker.setBookingDate(ePostRequest.getEPostTracker().getBookingDate());
        ePostTracker.setStatusUpdateDate(ePostRequest.getEPostTracker().getStatusUpdateDate());
        ePostTracker.setSpeedPostId(ePostRequest.getEPostTracker().getSpeedPostId());

        return ePostTracker;

    }

    private AuditDetails createAuditDetails(RequestInfo requestInfo) {
        long currentTime = System.currentTimeMillis();
        String userId = requestInfo.getUserInfo().getUuid();
        return AuditDetails.builder()
                .createdBy(userId)
                .createdTime(currentTime)
                .lastModifiedBy(userId)
                .lastModifiedTime(currentTime)
                .build();
    }

    private void enrichPostHub(EPostTracker ePostTracker) {
        String pinCode = ePostTracker.getPinCode();
        String postalHubName = getPostalHubName(pinCode);
        ePostTracker.setPostalHub(postalHubName);
    }

    private String getPostalHubName(String pinCode) {
        // get post hub name and related pin codes to that postal hubs
        Map<String,List<String>> postalHubAndPinCodeMap = mdmsDataConfig.getPostalHubMap();
        List<String> postHubNames = new ArrayList<>();
        for (Map.Entry<String, List<String>> entry : postalHubAndPinCodeMap.entrySet()) {
            if (entry.getValue().contains(pinCode)) {
                postHubNames.add(entry.getKey());
            }
        }
        if (postHubNames.size() > 1) {
            log.error("multiple postal hubs found for pin code {}", pinCode);
            return postHubNames.get(0);
        }
        else if (postHubNames.isEmpty()) {
            String defaultPostalHub = config.getDefaultPostalHub();
            log.error("postal hub not found for pin code {} setting default postal hub {}", pinCode, defaultPostalHub);
            return defaultPostalHub;
        }
        else {
            return postHubNames.get(0);
        }
    }

}
