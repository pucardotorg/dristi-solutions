package org.pucar.dristi.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import com.jayway.jsonpath.PathNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.egov.common.models.individual.Individual;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.config.MdmsDataConfig;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.service.IndividualService;
import org.pucar.dristi.service.SmsNotificationService;

import java.util.Arrays;

import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.CaseOutcome;
import org.pucar.dristi.web.models.CaseOutcomeType;
import org.pucar.dristi.web.models.CaseOverallStatus;
import org.pucar.dristi.web.models.CaseOverallStatusType;
import org.pucar.dristi.web.models.CaseStageSubStage;
import org.pucar.dristi.web.models.Outcome;
import org.pucar.dristi.web.models.LifecycleStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;

import static org.pucar.dristi.config.ServiceConstants.*;

@Slf4j
@Component
public class CaseOverallStatusUtil {

    private final Configuration config;
    private final HearingUtil hearingUtil;
    private final OrderUtil orderUtil;
    private final Producer producer;
    private final ObjectMapper mapper;
    private final MdmsDataConfig mdmsDataConfig;
    private List<org.pucar.dristi.web.models.CaseOverallStatusType> caseOverallStatusTypeList;
    private final Util util;

    private final CaseUtil caseUtil;

    private final AdvocateUtil advocateUtil;

    private final IndividualService individualService;

    private final SmsNotificationService notificationService;

    private final CaseStageTrackingUtil caseStageTrackingUtil;

    private final SecondaryStageProcessor secondaryStageProcessor;

    private final ApplicationUtil applicationUtil;


    @Autowired
    public CaseOverallStatusUtil(Configuration config, HearingUtil hearingUtil, OrderUtil orderUtil, Producer producer, ObjectMapper mapper, MdmsDataConfig mdmsDataConfig, CaseUtil caseUtil, AdvocateUtil advocateUtil, IndividualService individualService, SmsNotificationService notificationService, Util util, CaseStageTrackingUtil caseStageTrackingUtil, SecondaryStageProcessor secondaryStageProcessor, ApplicationUtil applicationUtil) {
        this.config = config;
        this.hearingUtil = hearingUtil;
        this.orderUtil = orderUtil;
        this.producer = producer;
        this.mapper = mapper;
        this.mdmsDataConfig = mdmsDataConfig;
        this.caseUtil = caseUtil;
        this.advocateUtil = advocateUtil;
        this.individualService = individualService;
        this.notificationService = notificationService;
        this.util = util;
        this.caseStageTrackingUtil = caseStageTrackingUtil;
        this.secondaryStageProcessor = secondaryStageProcessor;
        this.applicationUtil = applicationUtil;
    }

    public Object checkCaseOverAllStatus(String entityType, String referenceId, String status, String action, String tenantId, JSONObject requestInfo) throws JsonProcessingException {
        try {
            JSONObject request = new JSONObject();
            request.put("RequestInfo", requestInfo);
            caseOverallStatusTypeList = mdmsDataConfig.getCaseOverallStatusTypeMap().get(entityType);
            if (config.getCaseBusinessServiceList().contains(entityType)) {
                //Due to two actions with same name case stage is not updating correctly. So added check for status along with actions
                //Currently only implemented this logic for case, might have to for other modules in case of similar issue
                return processCaseOverallStatus(request, referenceId, status, action, tenantId);
            } else if (config.getHearingBusinessServiceList().contains(entityType)) {
                return processHearingCaseOverallStatus(request, referenceId, action, tenantId);
            } else if (config.getOrderBusinessServiceList().contains(entityType)) {
                return processOrderOverallStatus(request, referenceId, status, tenantId);
            } else if (config.getApplicationBusinessServiceList().contains(entityType)) {
                return processApplicationSecondaryStageUpdate(request, referenceId, status, action, tenantId);
            } else if (config.getTaskBusinessServiceList().contains(entityType) || "task-notice".equalsIgnoreCase(entityType)) {
                return processTaskSecondaryStageUpdate(request, entityType, referenceId, tenantId, status);
            }
            log.info("Case overall status not supported for entityType: {}", entityType);
            return null;
        } catch (InterruptedException e) {
            log.error("Processing interrupted for entityType: {}", entityType, e);
            Thread.currentThread().interrupt(); // Restore the interrupted status
            throw new RuntimeException(e);
        }
    }

    private Object processOrderOverallStatus(JSONObject request, String referenceId, String status, String tenantId) throws InterruptedException {
        Thread.sleep(config.getApiCallDelayInSeconds() * 1000);
        Object orderObject = orderUtil.getOrder(request, referenceId, config.getStateLevelTenantId());
        String filingNumber = JsonPath.read(orderObject.toString(), FILING_NUMBER_PATH);
        String orderCategory = JsonPath.read(orderObject.toString(), ORDER_CATEGORY_PATH);
        boolean isHearingFound = false;
        TreeMap<Integer, CaseOverallStatus> priorityMap = new TreeMap<>();
        try {
            String hearingType = JsonPath.read(orderObject.toString(), PURPOSE_OF_NEXT_HEARING_PATH);
            isHearingFound = hearingType != null;
            if (isHearingFound) {
                populateHearingPriorityMap(filingNumber, tenantId, hearingType, priorityMap);
            }
        } catch (Exception e) {
            log.error("Error processing order while processing priority map: {} for filing number: {}", e.getMessage(), filingNumber, e);
        }
        try {

            Object caseObject = caseUtil.getCase(request, config.getStateLevelTenantId(), null, filingNumber, null);
            if (caseObject == null) {
                log.info("Case not found for filingNumber: {} during join-case stage update", filingNumber);
                return null;
            }

            CaseOverallStatus caseOverallStatus = null;
            List<String> orderTypeList = new ArrayList<>();

            if (COMPOSITE.equalsIgnoreCase(orderCategory)) {

                JSONArray compositeItems = util.constructArray(orderObject.toString(), ORDER_COMPOSITE_ITEMS_PATH);
                if (compositeItems == null || compositeItems.length() == 0) {
                    log.warn("No composite items found for filing number: {}", filingNumber);
                    return orderObject;
                }
                List<String> collectedSecondaryStages = new ArrayList<>();
                for (int i = 0; i < compositeItems.length(); i++) {
                    try {
                        JSONObject compositeItem = compositeItems.getJSONObject(i);
                        orderTypeList.add(JsonPath.read(compositeItem.toString(), ORDER_TYPE_PATH));
                        boolean canPublishCaseOverallStatus = i == compositeItems.length() - 1;
                        caseOverallStatus = processIndividualOrder(request, filingNumber, tenantId, status, compositeItem.toString(), COMPOSITE, canPublishCaseOverallStatus, isHearingFound, priorityMap, collectedSecondaryStages, caseObject);
                    } catch (Exception e) {
                        log.error("Error processing composite item: {} for filing number: {}", e.getMessage(), filingNumber, e);
                    }
                }
                // Batch-start all collected secondary stages in one ES write + one Kafka publish
                if (!collectedSecondaryStages.isEmpty()) {
                    try {
                        secondaryStageProcessor.batchStartSecondaryStages(filingNumber, tenantId, collectedSecondaryStages, request, caseObject);
                    } catch (Exception e) {
                        log.error("Error batch starting secondary stages for filing number: {}", filingNumber, e);
                    }
                }

            } else {
                orderTypeList.add(JsonPath.read(orderObject.toString(), ORDER_TYPE_PATH));
                processIndividualOrder(request, filingNumber, tenantId, status, orderObject.toString(), null, true, isHearingFound, priorityMap, null, caseObject);
            }

            if (orderTypeList.contains(MOVE_CASE_OUT_OF_LONG_PENDING_REGISTER)) {
                String newStage;
                if (caseOverallStatus != null) {
                    newStage = caseOverallStatus.getStage();
                    // Restored stage comes from the highest-priority stage in the priority map
                } else {
                    newStage = JsonPath.read(caseObject.toString(), CASE_STAGE_PATH);
                }
                caseStageTrackingUtil.transitionStage(filingNumber, JsonPath.read(caseObject.toString(), CASEID_PATH), tenantId, "Long Pending Register", newStage);
                log.info("ended stage '{}', started restored stage '{}' for filingNumber: {}", "Long Pending Register", newStage, filingNumber);
            }
        } catch (JSONException e) {
            log.error("Error processing JSON structure in composite items: {}, for filing number: {}", e.getMessage(), filingNumber, e);
        } catch (PathNotFoundException e) {
            log.error("Required JSON path not found in composite items: {} for filing number: {}", e.getMessage(), filingNumber, e);
        } catch (Exception e) {
            log.error("Unexpected error while processing composite items: {} for filing number: {}", e.getMessage(), filingNumber, e);
        }
        return orderObject;
    }

    private void populateHearingPriorityMap(String filingNumber, String tenantId, String hearingType, TreeMap<Integer, CaseOverallStatus> priorityMap) {
        for (CaseOverallStatusType caseOverallStatusType : caseOverallStatusTypeList) {
            if (HEARING.equalsIgnoreCase(caseOverallStatusType.getEntityType()) && caseOverallStatusType.getTypeIdentifier().equalsIgnoreCase(hearingType)) {
                Integer priority = caseOverallStatusType.getPriority() != null ? caseOverallStatusType.getPriority() : Integer.MAX_VALUE;
                CaseOverallStatus caseOverallStatus = new CaseOverallStatus(filingNumber, tenantId, caseOverallStatusType.getStage());
                priorityMap.put(priority, caseOverallStatus);
            }
        }
        if (priorityMap.isEmpty()) {
            log.error("No priority found for hearing type: {} for filing number: {}", hearingType, filingNumber);
        }
    }

    private Object processApplicationSecondaryStageUpdate(JSONObject request, String referenceId, String status, String action, String tenantId) {
        try {
            Object applicationObject = applicationUtil.getApplication(request, config.getStateLevelTenantId(), referenceId);
            if (applicationObject == null) {
                log.info("Application not found for referenceId: {} during secondary stage update", referenceId);
                return null;
            }
            String filingNumber = JsonPath.read(applicationObject.toString(), FILING_NUMBER_PATH);
            String applicationType = JsonPath.read(applicationObject.toString(), APPLICATION_TYPE_PATH);
            Object caseObject = caseUtil.getCase(request, config.getStateLevelTenantId(), null, filingNumber, null);

            log.info("Processing application secondary stage: filingNumber={}, applicationType={}, status={}", filingNumber, applicationType, status);
            secondaryStageProcessor.processApplicationSecondaryStage(filingNumber, tenantId, applicationType, status, request, caseObject);
            return applicationObject;
        } catch (Exception e) {
            log.error("Error processing application secondary stage for referenceId: {}", referenceId, e);
            return null;
        }
    }

    private Object processTaskSecondaryStageUpdate(JSONObject request, String entityType, String referenceId, String tenantId, String status) {
        try {
            if (status != null && TASK_END_TRIGGER_STATUSES.contains(status)) {
                log.info("Processing task secondary stage end trigger: entityType={}, referenceId={}", entityType, referenceId);
                secondaryStageProcessor.processTaskEndTrigger(referenceId, tenantId, entityType, request);
            }
            return null;
        } catch (Exception e) {
            log.error("Error processing task secondary stage for referenceId: {}, entityType: {}", referenceId, entityType, e);
            return null;
        }
    }

    private Object processCaseOverallStatus(JSONObject request, String referenceId, String status, String action, String tenantId) throws JsonProcessingException {
        RequestInfo requestInfo = mapper.readValue(request.getJSONObject("RequestInfo").toString(), RequestInfo.class);
        Object caseObject = caseUtil.getCase(request, config.getStateLevelTenantId(), null, referenceId, null);

        // Enrich caseId/courtId BEFORE stage transition to avoid stale-read overwrites in ES
        try {
            String caseId = JsonPath.read(caseObject.toString(), CASEID_PATH);
            String courtId = JsonPath.read(caseObject.toString(), CASE_COURTID_PATH);
            caseStageTrackingUtil.enrichCaseId(referenceId, caseId, courtId);
        } catch (Exception e) {
            log.debug("Could not enrich caseId in stage tracking for filingNumber: {}", referenceId);
        }

        CaseOverallStatus caseOverallStatus = determineCaseStage(referenceId, tenantId, status, action, requestInfo);
        publishToCaseOverallStatus(caseOverallStatus, request, caseObject);

        // When case is registered, check if delay condonation is required and start the secondary stage
        if (caseOverallStatus != null && STAGE_COGNIZANCE.equalsIgnoreCase(caseOverallStatus.getStage())) {
            try {
                secondaryStageProcessor.processCaseRegistrationSecondaryStage(referenceId, tenantId, caseObject, request);
            } catch (Exception e) {
                log.error("Error checking delay condonation for case registration, filingNumber: {}", referenceId, e);
            }
        }

        return caseOverallStatus;
    }

    private Object processHearingCaseOverallStatus(JSONObject request, String referenceId, String action, String tenantId) throws InterruptedException {
        Thread.sleep(config.getApiCallDelayInSeconds() * 1000);
        Object hearingObject = hearingUtil.getHearing(request, null, null, referenceId, config.getStateLevelTenantId());
        List<String> filingNumberList = JsonPath.read(hearingObject.toString(), FILING_NUMBER_PATH);
        String filingNumber;
        if (filingNumberList != null && !filingNumberList.isEmpty()) {
            filingNumber = filingNumberList.get(0);
        } else {
            log.info("Inside indexer util processHearingCaseOverallStatus:: Filing number not present");
            throw new RuntimeException("Filing number not present for case overall status");
        }
        String hearingType = JsonPath.read(hearingObject.toString(), HEARING_TYPE_PATH);
        Object caseObject = caseUtil.getCase(request, config.getStateLevelTenantId(), null, filingNumber, null);

        publishToCaseOverallStatus(determineHearingStage(filingNumber, tenantId, hearingType, action), request, caseObject);
        return hearingObject;
    }

    private org.pucar.dristi.web.models.CaseOverallStatus determineCaseStage(String filingNumber, String tenantId, String status, String action, RequestInfo requestInfo) {
        for (org.pucar.dristi.web.models.CaseOverallStatusType statusType : caseOverallStatusTypeList) {
            log.info("CaseOverallStatusType MDMS action ::{} and status :: {}", statusType.getAction(), statusType.getState());
            if (statusType.getAction().equalsIgnoreCase(action) && statusType.getState().equalsIgnoreCase(status)) {
                log.info("Creating CaseOverallStatus for action ::{} and status :: {}", statusType.getAction(), statusType.getState());

                // Track stage timing in ES: add new stage entry with startTime=now, endTime=null
                trackStageTransition(filingNumber, tenantId, statusType);

                return new org.pucar.dristi.web.models.CaseOverallStatus(filingNumber, tenantId, statusType.getStage());
            }
        }
        return null;
    }

    /**
     * Tracks stage transitions in an ES index for each case.
     * - Adds the new stage to the stages list with startTime=now and endTime=null.
     * - If statusType has a non-null endStage, finds that stage in the index and sets its endTime=now.
     * - If no tracking document exists for this case, creates one.
     */
    private void trackStageTransition(String filingNumber, String tenantId, CaseOverallStatusType statusType) {
        try {
            String newStage = statusType.getStage();
            String endStage = statusType.getEndStage();
            log.info("Stage transition for filingNumber: {}, endStage='{}', newStage='{}'", filingNumber, endStage, newStage);
            caseStageTrackingUtil.transitionStage(filingNumber, null, tenantId, endStage, newStage);
        } catch (Exception e) {
            log.error("Error tracking stage transition for filingNumber: {}", filingNumber, e);
        }
    }

    private void sendSmsForCaseSubStageChange(String filingNumber, RequestInfo requestInfo, String subStage) {
        org.pucar.dristi.web.models.CaseSearchRequest caseSearchRequest = createCaseSearchRequest(requestInfo, filingNumber);
        JsonNode caseDetails = caseUtil.searchCaseDetails(caseSearchRequest);
        String courtCaseNumber = caseUtil.getCourtCaseNumber(caseDetails);
        String cmpNumber = caseUtil.getCmpNumber(caseDetails);
        JsonNode litigants = caseUtil.getLitigants(caseDetails);
        Set<String> individualIds = caseUtil.getIndividualIds(litigants);
        SmsTemplateData smsTemplateData = enrichSmsTemplateData(filingNumber, cmpNumber, courtCaseNumber, requestInfo, subStage);
        List<String> phoneNumbers = callIndividualService(requestInfo, new ArrayList<>(individualIds));
        for (String number : phoneNumbers) {
            notificationService.sendNotification(requestInfo, smsTemplateData, CASE_STATUS_CHANGED_MESSAGE, number);
        }
    }

    private boolean shouldSendSMSForSubStageChange(String subStage) {
        if (subStage == null) {
            return false;
        }
        List<String> consideredSubStages = List.of(APPEARANCE, ARGUMENTS, EVIDENCE, LONG_PENDING_REGISTER, REFER_TO_ADR);
        return consideredSubStages.contains(subStage);
    }

    private SmsTemplateData enrichSmsTemplateData(String filingNumber, String cmpNumber, String courtCaseNumber, RequestInfo requestInfo, String subStage) {
        return SmsTemplateData.builder()
                .efilingNumber(filingNumber)
                .subStage(subStage)
                .cmpNumber(cmpNumber)
                .courtCaseNumber(courtCaseNumber)
                .tenantId(requestInfo.getUserInfo().getTenantId())
                .build();
    }

    private CaseSearchRequest createCaseSearchRequest(RequestInfo requestInfo, String filingNumber) {
        CaseSearchRequest caseSearchRequest = new CaseSearchRequest();
        caseSearchRequest.setRequestInfo(requestInfo);
        CaseCriteria caseCriteria = CaseCriteria.builder().filingNumber(filingNumber).defaultFields(false).build();
        caseSearchRequest.addCriteriaItem(caseCriteria);
        return caseSearchRequest;
    }

    private List<String> callIndividualService(RequestInfo requestInfo, List<String> individualIds) {

        List<String> mobileNumber = new ArrayList<>();
        for (String id : individualIds) {
            List<Individual> individuals = individualService.getIndividualsByIndividualId(requestInfo, id);
            if (individuals.get(0).getMobileNumber() != null) {
                mobileNumber.add(individuals.get(0).getMobileNumber());
            }
        }
        return mobileNumber;
    }

    private org.pucar.dristi.web.models.CaseOverallStatus determineHearingStage(String filingNumber, String tenantId, String hearingType, String action) {
        for (org.pucar.dristi.web.models.CaseOverallStatusType statusType : caseOverallStatusTypeList) {
            if (statusType.getAction().equalsIgnoreCase(action) && statusType.getTypeIdentifier().equalsIgnoreCase(hearingType))
                return new org.pucar.dristi.web.models.CaseOverallStatus(filingNumber, tenantId, statusType.getStage());
        }
        return null;
    }

    private org.pucar.dristi.web.models.CaseOverallStatus determineOrderStage(String filingNumber, String tenantId, String orderType, String status, String hearingType, TreeMap<Integer, CaseOverallStatus> priorityMap, Object caseObject) {
        if (SUMMONS.equalsIgnoreCase(orderType)) {
            boolean isAccusedJoinedCase = hasAccusedJoinedCase(caseObject);
            if (!isAccusedJoinedCase) {
                CaseOverallStatus caseOverallStatus = new CaseOverallStatus(filingNumber, tenantId, STAGE_APPEARANCE);
                Integer priority = Integer.MAX_VALUE;
                priorityMap.put(priority, caseOverallStatus);
                return caseOverallStatus;
            }
        }

        for (CaseOverallStatusType statusType : caseOverallStatusTypeList) {
            boolean isMatch = false;

            if (statusType.getEntityType() != null) {
                if (ORDER.equalsIgnoreCase(statusType.getEntityType()) && statusType.getState().equalsIgnoreCase(status)) {
                    if ("Post-Disposal".equalsIgnoreCase(statusType.getStage())) {
                        String[] orderTypeList = statusType.getTypeIdentifier().split(",");
                        if (Arrays.asList(orderTypeList).contains(orderType))
                            isMatch = true;
                    } else if (statusType.getTypeIdentifier().equalsIgnoreCase(orderType)) {
                        isMatch = true;
                    }
                } else if (HEARING.equalsIgnoreCase(statusType.getEntityType()) && statusType.getTypeIdentifier().equalsIgnoreCase(hearingType) && statusType.getState().equalsIgnoreCase(status)) {
                    isMatch = true;
                }
            } else if (statusType.getTypeIdentifier().equalsIgnoreCase(orderType) && statusType.getState().equalsIgnoreCase(status)) {
                isMatch = true;
            }

            if (isMatch) {
                CaseOverallStatus caseOverallStatus = new CaseOverallStatus(filingNumber, tenantId, statusType.getStage());
                Integer priority = statusType.getPriority() != null ? statusType.getPriority() : Integer.MAX_VALUE;
                priorityMap.put(priority, caseOverallStatus);
                return caseOverallStatus;
            }
        }
        return null;
    }

    /**
     * Processes a join-case event to determine if the primary stage should transition
     * from Appearance to Bail & Recording of Plea.
     * Per PRD: When a user belonging to the Accused side joins the case and the current
     * primary stage is Appearance, the case moves to Bail & Recording of Plea.
     */
    public void processJoinCaseStageUpdate(Map<String, Object> joinCaseJson) {
        try {
            String filingNumber = joinCaseJson.get("filingNumber") != null
                    ? joinCaseJson.get("filingNumber").toString() : null;
            if (filingNumber == null) {
                log.info("filingNumber not found in join-case message, skipping stage update");
                return;
            }
            String tenantId = joinCaseJson.get("tenantId") != null
                    ? joinCaseJson.get("tenantId").toString() : config.getStateLevelTenantId();

            JSONObject request = new JSONObject();
            Object requestInfoObj = joinCaseJson.get("requestInfo");
            if (requestInfoObj == null) {
                requestInfoObj = joinCaseJson.get("RequestInfo");
            }
            RequestInfo requestInfo;
            if (requestInfoObj != null) {
                requestInfo = mapper.readValue(mapper.writeValueAsString(requestInfoObj), RequestInfo.class);
            } else {
                requestInfo = new RequestInfo();
            }
            if (requestInfo.getUserInfo() == null) {
                requestInfo.setUserInfo(new User());
            }
            requestInfo.getUserInfo().setType("SYSTEM");
            Role role = Role.builder().code("SYSTEM").name("SYSTEM").tenantId(tenantId).build();
            requestInfo.getUserInfo().setRoles(List.of(role));
            requestInfo.getUserInfo().setTenantId(tenantId);
            request.put("RequestInfo", new JSONObject(mapper.writeValueAsString(requestInfo)));

            Object caseObject = caseUtil.getCase(request, config.getStateLevelTenantId(), null, filingNumber, null);
            if (caseObject == null) {
                log.info("Case not found for filingNumber: {} during join-case stage update", filingNumber);
                return;
            }
            String currentStage = JsonPath.read(caseObject.toString(), CASE_STAGE_PATH);
            String caseId = JsonPath.read(caseObject.toString(), CASEID_PATH);
            log.info("Join-case stage update: filingNumber={}, currentStage={}", filingNumber, currentStage);

            if (STAGE_APPEARANCE.equalsIgnoreCase(currentStage) && hasAccusedJoinedCase(caseObject)) {
                log.info("Case {} is in Appearance stage and accused has joined, transitioning to Bail & Recording of Plea", filingNumber);
                CaseOverallStatus caseOverallStatus = new CaseOverallStatus(
                        filingNumber, tenantId, STAGE_BAIL_AND_RECORDING_OF_PLEA);
                publishToCaseOverallStatus(caseOverallStatus, request, caseObject);
                caseStageTrackingUtil.transitionStage(filingNumber, caseId, tenantId, STAGE_APPEARANCE, STAGE_BAIL_AND_RECORDING_OF_PLEA);
            } else {
                log.info("Case {} stage is '{}'. No Appearance->Bail transition for join-case event.",
                        filingNumber, currentStage);
            }

            // Check if Proclamation & Attachment secondary stage should end due to accused joining
            if (hasAccusedJoinedCase(caseObject)) {
                try {
                    secondaryStageProcessor.processJoinCaseSecondaryStage(filingNumber, tenantId, request, caseObject);
                } catch (Exception ex) {
                    log.error("Error processing Proclamation secondary stage end trigger for filingNumber: {}", filingNumber, ex);
                }
            }
        } catch (Exception e) {
            log.error("Error processing join-case stage update", e);
        }
    }

    private void publishToCaseOverallStatus(CaseOverallStatus caseOverallStatus, JSONObject request, Object caseObject) {
        try {
            if (caseOverallStatus == null) {
                log.info("Case overall workflow update not eligible");
            } else if (caseOverallStatus.getFilingNumber() == null) {
                log.error("Filing number not present for Case overall workflow update");
            } else {
                RequestInfo requestInfo = mapper.readValue(request.getJSONObject("RequestInfo").toString(), RequestInfo.class);
                String filingNumber = caseOverallStatus.getFilingNumber();

                AuditDetails auditDetails = new AuditDetails();
                String lastModifiedBy = (requestInfo.getUserInfo() != null && requestInfo.getUserInfo().getUuid() != null)
                        ? requestInfo.getUserInfo().getUuid() : "SYSTEM";
                auditDetails.setLastModifiedBy(lastModifiedBy);
                auditDetails.setLastModifiedTime(System.currentTimeMillis());
                caseOverallStatus.setAuditDetails(auditDetails);
                String subStage = caseOverallStatus.getStage();
                if (shouldSendSMSForSubStageChange(subStage)) {
                    sendSmsForCaseSubStageChange(filingNumber, requestInfo, subStage);
                }
                org.pucar.dristi.web.models.CaseStageSubStage caseStageSubStage = new CaseStageSubStage(requestInfo, caseOverallStatus);
                log.info("Publishing to kafka topic: {}, caseStageSubstage: {}", config.getCaseOverallStatusTopic(), caseStageSubStage);
                producer.push(config.getCaseOverallStatusTopic(), caseStageSubStage);
            }
        } catch (Exception e) {
            log.error("Error in publishToCaseOverallStatus method", e);
        }
    }

    /**
     * Checks whether any active litigant with partyType containing the accused party type
     * (respondent) exists in the case litigants list.
     */
    private boolean hasAccusedJoinedCase(Object caseObject) {
        try {
            List<Map<String, Object>> litigants = JsonPath.read(caseObject.toString(), CASE_LITIGANTS_PATH);
            if (litigants == null || litigants.isEmpty()) {
                return false;
            }
            for (Map<String, Object> litigant : litigants) {
                Object partyType = litigant.get("partyType");
                if (partyType != null && partyType.toString().contains(ACCUSED_PARTY_TYPE)) {
                    log.info("Found active accused-side litigant with partyType: {}", partyType);
                    return true;
                }
            }
        } catch (Exception e) {
            log.error("Error checking if accused has joined case", e);
        }
        return false;
    }

    private org.pucar.dristi.web.models.Outcome determineCaseOutcome(String filingNumber, String tenantId, String orderType, String status, Object orderObject, String orderCategory) {
        if (!"published".equalsIgnoreCase(status)) return null;

        org.pucar.dristi.web.models.CaseOutcomeType caseOutcomeType = mdmsDataConfig.getCaseOutcomeTypeMap().get(orderType);
        if (caseOutcomeType == null) {
            log.info("CaseOutcomeType not found for orderType: {}", orderType);
            return null;
        }

        try {
            String natureOfDisposalStr = COMPOSITE.equalsIgnoreCase(orderCategory) ? JsonPath.read(orderObject.toString(), COMPOSITE_ORDER_NATURE_OF_DISPOSAL_PATH) : JsonPath.read(orderObject.toString(), ORDER_NATURE_OF_DISPOSAL_PATH);
            NatureOfDisposal natureOfDisposal = parseNatureOfDisposal(natureOfDisposalStr);
            if (caseOutcomeType.getIsJudgement()) {
                return handleJudgementCase(filingNumber, tenantId, caseOutcomeType, orderObject, orderCategory);
            } else {
                return new org.pucar.dristi.web.models.Outcome(filingNumber, tenantId, caseOutcomeType.getOutcome(), natureOfDisposal);
            }
        } catch (Exception e) {
            log.error("Error determining case outcome for filingNumber: {} and orderType: {}", filingNumber, orderType, e);
            return null;
        }
    }

    private org.pucar.dristi.web.models.Outcome handleJudgementCase(String filingNumber, String tenantId, CaseOutcomeType caseOutcomeType, Object orderObject, String orderCategory) {
        try {
            String outcome = COMPOSITE.equalsIgnoreCase(orderCategory) ? JsonPath.read(orderObject.toString(), COMPOSITE_ORDER_FINDINGS_PATH) : JsonPath.read(orderObject.toString(), ORDER_FINDINGS_PATH);
            String natureOfDisposalStr = COMPOSITE.equalsIgnoreCase(orderCategory) ? JsonPath.read(orderObject.toString(), COMPOSITE_ORDER_NATURE_OF_DISPOSAL_PATH) : JsonPath.read(orderObject.toString(), ORDER_NATURE_OF_DISPOSAL_PATH);
            NatureOfDisposal natureOfDisposal = parseNatureOfDisposal(natureOfDisposalStr);

            if (caseOutcomeType.getJudgementList().contains(outcome)) {
                return new org.pucar.dristi.web.models.Outcome(filingNumber, tenantId, outcome, natureOfDisposal);
            } else {
                log.info("Outcome not in judgement list for orderType: {}", caseOutcomeType.getOrderType());
                return null;
            }
        } catch (PathNotFoundException e) {
            log.error("JSON path not found: {}", ORDER_FINDINGS_PATH, e);
            return null;
        }
    }

    private void publishToCaseOutcome(Outcome outcome, JSONObject request) {
        try {
            if (outcome == null) {
                log.info("Case outcome update not eligible");
            } else if (outcome.getFilingNumber() == null) {
                log.error("Filing number not present for case outcome update");
            } else {
                RequestInfo requestInfo = mapper.readValue(request.getJSONObject("RequestInfo").toString(), RequestInfo.class);
                String filingNumber = outcome.getFilingNumber();
                Object caseObject = caseUtil.getCase(request, config.getStateLevelTenantId(), null, filingNumber, null);
                String lifecycleStatus = null;
                try {
                    lifecycleStatus = JsonPath.read(caseObject.toString(), CASE_LIFECYCLE_STATUS_PATH);
                } catch (PathNotFoundException e) {
                    log.debug("lifecycleStatus not found for filingNumber: {}, defaulting to null", filingNumber);
                }
                if (LifecycleStatus.LPR.name().equals(lifecycleStatus)) {
                    log.info("case is in long pending registration {} not eligible for case outcome update", filingNumber);
                    return;
                }
                AuditDetails auditDetails = new AuditDetails();
                auditDetails.setLastModifiedBy(requestInfo.getUserInfo().getUuid());
                auditDetails.setLastModifiedTime(System.currentTimeMillis());
                outcome.setAuditDetails(auditDetails);
                org.pucar.dristi.web.models.CaseOutcome caseOutcome = new CaseOutcome(requestInfo, outcome);
                log.info("Publishing to kafka topic: {}, caseOutcome: {}", config.getCaseOutcomeTopic(), caseOutcome);
                producer.push(config.getCaseOutcomeTopic(), caseOutcome);
            }
        } catch (Exception e) {
            log.error("Error in publishToCaseOutcome method", e);
        }
    }

    private NatureOfDisposal parseNatureOfDisposal(String natureOfDisposalStr) {
        if (natureOfDisposalStr == null) return null;
        try {
            return NatureOfDisposal.valueOf(natureOfDisposalStr.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            log.error("Invalid natureOfDisposal value: {}", natureOfDisposalStr);
            return null;
        }
    }


    private CaseOverallStatus processIndividualOrder(JSONObject request, String filingNumber, String tenantId, String status, String orderItemJson, String orderCategory,
                                                     boolean canPublishCaseOverallStatus, boolean isHearingFound, TreeMap<Integer, CaseOverallStatus> priorityMap,
                                                     List<String> collectedSecondaryStages, Object caseObject) {
        String orderType = JsonPath.read(orderItemJson, ORDER_TYPE_PATH);
        String hearingType = null;

        // Enrich caseId/courtId BEFORE any stage transitions to avoid stale-read overwrites in ES
        try {
            String caseId = JsonPath.read(caseObject.toString(), CASEID_PATH);
            String courtId = JsonPath.read(caseObject.toString(), CASE_COURTID_PATH);
            caseStageTrackingUtil.enrichCaseId(filingNumber, caseId, courtId);
        } catch (Exception e) {
            log.debug("Could not enrich caseId in stage tracking for filingNumber: {}", filingNumber);
        }

        if (!isHearingFound) {
            if (SCHEDULE_OF_HEARING_DATE.equalsIgnoreCase(orderType) || SCHEDULING_NEXT_HEARING.equalsIgnoreCase(orderType)) {
                String path = null;
                for (CaseOverallStatusType caseOverallStatusType : caseOverallStatusTypeList) {
                    if (HEARING.equalsIgnoreCase(caseOverallStatusType.getEntityType())) {
                        if (COMPOSITE.equalsIgnoreCase(orderCategory)) {
                            path = caseOverallStatusType.getCompositeHearingPath();
                        } else {
                            path = caseOverallStatusType.getIntermediateHearingPath();
                        }
                        break;
                    }
                }
                if (path != null) {
                    try {
                        hearingType = JsonPath.read(orderItemJson, path);
                    } catch (Exception e) {
                        log.error("Error reading hearing type from path: {} for filing number: {}", path, filingNumber, e);
                    }
                }
            }
        }

        determineOrderStage(filingNumber, tenantId, orderType, status, hearingType, priorityMap, caseObject);

        // LPR move-to must run for every order item (including composite items)
        String currentCaseStage = JsonPath.read(caseObject.toString(), CASE_STAGE_PATH);
        if (MOVE_CASE_TO_LONG_PENDING_REGISTER.equalsIgnoreCase(orderType)) {
            String caseId = JsonPath.read(caseObject.toString(), CASEID_PATH);
            caseStageTrackingUtil.transitionStage(filingNumber, caseId, tenantId, currentCaseStage, "Long Pending Register");
            if (caseObject instanceof JSONObject) {
                ((JSONObject) caseObject).put("stage", "Long Pending Register");
            }
            currentCaseStage = "Long Pending Register";
            log.info("ended stage '{}', started stage '{}' for filingNumber: {}", currentCaseStage, "Long Pending Register", filingNumber);
        }

        CaseOverallStatus finalCaseOverallStatus = null;
        if (canPublishCaseOverallStatus && !priorityMap.isEmpty()) {
            finalCaseOverallStatus = priorityMap.firstEntry().getValue();

            log.info("Publishing case overall status with priority: {} for filing number: {}", priorityMap.firstEntry().getKey(), filingNumber);
            publishToCaseOverallStatus(finalCaseOverallStatus, request, caseObject);

            String newStage = finalCaseOverallStatus.getStage();

            if (SUMMONS.equalsIgnoreCase(orderType) && !hasAccusedJoinedCase(caseObject)) {
                String caseId = JsonPath.read(caseObject.toString(), CASEID_PATH);
                caseStageTrackingUtil.transitionStage(filingNumber, caseId, tenantId, STAGE_COGNIZANCE, newStage);
            } else if (!MOVE_CASE_TO_LONG_PENDING_REGISTER.equalsIgnoreCase(orderType)
                    && newStage != null && !newStage.equalsIgnoreCase(currentCaseStage)) {
                // Generic stage transition for all other order types (LPR move-to already handled above)
                String caseId = JsonPath.read(caseObject.toString(), CASEID_PATH);
                caseStageTrackingUtil.transitionStage(filingNumber, caseId, tenantId, currentCaseStage, newStage);
                log.info("Stage transition for filingNumber: {}, endStage='{}', newStage='{}'", filingNumber, currentCaseStage, newStage);
            }
        }
        publishToCaseOutcome(determineCaseOutcome(filingNumber, tenantId, orderType, status, orderItemJson, orderCategory), request);

        // Secondary stage processing: evaluate order-based triggers independently from primary stage
        try {
            if (collectedSecondaryStages != null) {
                // Composite mode: collect secondary stage for batch processing after the loop
                String secondaryStage = secondaryStageProcessor.resolveSecondaryStage(orderType, status);
                if (secondaryStage != null) {
                    collectedSecondaryStages.add(secondaryStage);
                }
            } else {
                // Non-composite: process immediately
                secondaryStageProcessor.processOrderSecondaryStage(filingNumber, tenantId, orderType, status, request, caseObject);
            }
        } catch (Exception e) {
            log.error("Error in secondary stage processing for order type: {} filingNumber: {}", orderType, filingNumber, e);
        }
        return finalCaseOverallStatus;
    }
}
