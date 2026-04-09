package org.pucar.dristi.util;

import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.config.MdmsDataConfig;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.web.models.CaseOverallStatus;
import org.pucar.dristi.web.models.CaseStageSubStage;
import org.pucar.dristi.web.models.taskManagement.DeliveryChannel;
import org.pucar.dristi.web.models.taskManagement.PartyDetails;
import org.pucar.dristi.web.models.taskManagement.TaskManagement;
import org.pucar.dristi.web.models.taskManagement.TaskSearchCriteria;
import org.pucar.dristi.web.models.taskManagement.TaskSearchRequest;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.pucar.dristi.config.ServiceConstants.*;

/**
 * Handles secondary stage lifecycle (start/end) independently from primary stage updates.
 * Secondary stages are tracked in the ES CaseStageTracking index under the secondaryStages list.
 * Multiple secondary stages can be active simultaneously.
 *
 * The computed active secondary stage(s) are published as the substage in CaseOverallStatus.
 */
@Slf4j
@Component
public class SecondaryStageProcessor {

    private final CaseStageTrackingUtil caseStageTrackingUtil;
    private final Configuration config;
    private final Producer producer;
    private final ObjectMapper mapper;
    private final CaseUtil caseUtil;
    private final MdmsDataConfig mdmsDataConfig;
    private final TaskManagementUtil taskManagementUtil;
    private final TaskUtil taskUtil;

    @Autowired
    public SecondaryStageProcessor(CaseStageTrackingUtil caseStageTrackingUtil, Configuration config, Producer producer, ObjectMapper mapper, CaseUtil caseUtil, MdmsDataConfig mdmsDataConfig, TaskManagementUtil taskManagementUtil, TaskUtil taskUtil) {
        this.caseStageTrackingUtil = caseStageTrackingUtil;
        this.config = config;
        this.producer = producer;
        this.mapper = mapper;
        this.caseUtil = caseUtil;
        this.mdmsDataConfig = mdmsDataConfig;
        this.taskManagementUtil = taskManagementUtil;
        this.taskUtil = taskUtil;
    }

    /**
     * Evaluates whether the given order triggers a secondary stage start.
     * Called from order processing flow with the order type and status.
     *
     * @param filingNumber case filing number
     * @param tenantId     tenant ID
     * @param orderType    the order type (e.g., NOTICE, SUMMONS, WARRANT)
     * @param status       the order status
     * @param request      the JSONObject request containing RequestInfo
     */
    public void processOrderSecondaryStage(String filingNumber, String tenantId, String orderType, String status, JSONObject request) {
        try {
            if (orderType == null || status == null) return;

            // Start triggers: order type published triggers corresponding secondary stage
            if (ORDER_STATUS_PUBLISHED.equalsIgnoreCase(status)) {
                Map<String, String> orderTypeToSubstageMap = mdmsDataConfig.getOrderTypeToSubstageMap();
                String secondaryStage = mapOrderTypeToSecondaryStage(orderType, orderTypeToSubstageMap);
                if (secondaryStage != null) {
                    log.info("Order type '{}' published triggers secondary stage '{}' for filingNumber: {}", orderType, secondaryStage, filingNumber);
                    caseStageTrackingUtil.startSecondaryStage(filingNumber, tenantId, secondaryStage);
                    manageNAStage(filingNumber, tenantId);
                    publishSubstageUpdate(filingNumber, tenantId, request);
                }
            }
        } catch (Exception e) {
            log.error("Error processing order secondary stage for filingNumber: {}, orderType: {}", filingNumber, orderType, e);
        }
    }

    /**
     * Evaluates whether the case registration should trigger the Delay Condonation secondary stage.
     * Checks caseDetails.delayApplications.formdata[0].data.delayCondonationType.code == "YES".
     * If yes, starts the Delay Condonation secondary stage.
     *
     * @param filingNumber case filing number
     * @param tenantId     tenant ID
     * @param caseObject   the case object fetched from the case service
     * @param request      the JSONObject request containing RequestInfo
     */
    public void processCaseRegistrationSecondaryStage(String filingNumber, String tenantId, Object caseObject, JSONObject request) {
        try {
            if (caseObject == null) return;

            String delayCondonationTypeCode = JsonPath.read(caseObject.toString(), DELAY_CONDONATION_TYPE_CODE_PATH);
            if (DELAY_CONDONATION_REQUIRED.equalsIgnoreCase(delayCondonationTypeCode)) {
                log.info("Delay condonation required (code='{}') for filingNumber: {}, starting secondary stage '{}'",
                        delayCondonationTypeCode, filingNumber, SECONDARY_STAGE_DELAY_CONDONATION);
                caseStageTrackingUtil.startSecondaryStage(filingNumber, tenantId, SECONDARY_STAGE_DELAY_CONDONATION);
                manageNAStage(filingNumber, tenantId);
                publishSubstageUpdate(filingNumber, tenantId, request);
            } else {
                log.info("Delay condonation not required (code='{}') for filingNumber: {}", delayCondonationTypeCode, filingNumber);
            }
        } catch (com.jayway.jsonpath.PathNotFoundException e) {
            log.info("Delay condonation type path not found in case details for filingNumber: {}, skipping", filingNumber);
        } catch (Exception e) {
            log.error("Error processing case registration secondary stage for filingNumber: {}", filingNumber, e);
        }
    }

    /**
     * Evaluates whether the given application event triggers a secondary stage start or end.
     * Delay Condonation: start when application is created, end when accepted or rejected.
     *
     * @param filingNumber    case filing number
     * @param tenantId        tenant ID
     * @param applicationType the application type
     * @param status          the application status/action
     * @param request         the JSONObject request containing RequestInfo
     */
    public void processApplicationSecondaryStage(String filingNumber, String tenantId, String applicationType, String status, JSONObject request) {
        try {
            if (applicationType == null || status == null) return;

            if (APPLICATION_DELAY_CONDONATION.equalsIgnoreCase(applicationType)) {
                // Delay Condonation is not mapped to orderType, handle it separately
                String delayCondonationStage = "Delay Condonation";
                
                if (APPLICATION_STATUS_ACCEPTED.equalsIgnoreCase(status) || APPLICATION_STATUS_REJECTED.equalsIgnoreCase(status)) {
                    // End trigger for Delay Condonation
                    log.info("Application '{}' status '{}' ends secondary stage '{}' for filingNumber: {}", applicationType, status, delayCondonationStage, filingNumber);
                    caseStageTrackingUtil.endSecondaryStage(filingNumber, delayCondonationStage);
                    manageNAStage(filingNumber, tenantId);
                    publishSubstageUpdate(filingNumber, tenantId, request);
                } else {
                    // Start trigger for Delay Condonation (application created/submitted)
                    log.info("Application '{}' triggers secondary stage '{}' for filingNumber: {}", applicationType, delayCondonationStage, filingNumber);
                    caseStageTrackingUtil.startSecondaryStage(filingNumber, tenantId, delayCondonationStage);
                    manageNAStage(filingNumber, tenantId);
                    publishSubstageUpdate(filingNumber, tenantId, request);
                }
            }
        } catch (Exception e) {
            log.error("Error processing application secondary stage for filingNumber: {}, applicationType: {}", filingNumber, applicationType, e);
        }
    }

    /**
     * Evaluates whether the given hearing event triggers a secondary stage start or end.
     * Mediation: start when hearing purpose is Mediation, end when a new hearing with different purpose is scheduled.
     *
     * @param filingNumber case filing number
     * @param tenantId     tenant ID
     * @param hearingType  the hearing purpose/type
     * @param request      the JSONObject request containing RequestInfo
     */
    public void processHearingSecondaryStage(String filingNumber, String tenantId, String hearingType, JSONObject request) {
        try {
            if (hearingType == null) return;

            // Mediation is not mapped to orderType, handle it separately
            String mediationStage = "Mediation";

            if (HEARING_PURPOSE_MEDIATION.equalsIgnoreCase(hearingType)) {
                // Start trigger: hearing purpose is Mediation
                log.info("Hearing purpose '{}' triggers secondary stage '{}' for filingNumber: {}", hearingType, mediationStage, filingNumber);
                caseStageTrackingUtil.startSecondaryStage(filingNumber, tenantId, mediationStage);
                manageNAStage(filingNumber, tenantId);
                publishSubstageUpdate(filingNumber, tenantId, request);
            } else {
                // End trigger for Mediation: a new hearing with a different purpose is scheduled
                List<String> activeStages = caseStageTrackingUtil.getActiveSecondaryStageNames(filingNumber);
                if (activeStages.contains(mediationStage)) {
                    log.info("New hearing with purpose '{}' ends secondary stage '{}' for filingNumber: {}", hearingType, mediationStage, filingNumber);
                    caseStageTrackingUtil.endSecondaryStage(filingNumber, mediationStage);
                    manageNAStage(filingNumber, tenantId);
                    publishSubstageUpdate(filingNumber, tenantId, request);
                }
            }
        } catch (Exception e) {
            log.error("Error processing hearing secondary stage for filingNumber: {}, hearingType: {}", filingNumber, hearingType, e);
        }
    }

    /**
     * Maps an order type to the corresponding secondary stage name using MDMS data.
     *
     * @param orderType the order type
     * @param orderTypeToSubstageMap map of orderType to substage from MDMS
     * @return the secondary stage name, or null if no mapping exists
     */
    private String mapOrderTypeToSecondaryStage(String orderType, Map<String, String> orderTypeToSubstageMap) {
        if (orderType == null || orderTypeToSubstageMap == null) return null;
        
        // Direct lookup first
        String directMatch = orderTypeToSubstageMap.get(orderType.toUpperCase());
        if (directMatch != null) {
            return directMatch;
        }
        
        // Partial match for order types that contain the key
        String upperOrderType = orderType.toUpperCase();
        for (Map.Entry<String, String> entry : orderTypeToSubstageMap.entrySet()) {
            if (upperOrderType.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        
        return null;
    }

    /**
     * Evaluates whether a task workflow event triggers a secondary stage end.
     * Called when a task workflow transition occurs (e.g., task-summons, task-warrant).
     * Checks if all task management records of the relevant type have delivery status updated.
     *
     * @param referenceId the task reference ID (taskNumber)
     * @param tenantId    tenant ID
     * @param entityType  the task business service (e.g., task-summons, task-warrant)
     * @param request     the JSONObject request containing RequestInfo
     */
    public void processTaskEndTrigger(String referenceId, String tenantId, String entityType, JSONObject request) {
        try {
            // Get filingNumber from the task
            Object taskObject = taskUtil.getTask(request, config.getStateLevelTenantId(), referenceId, null, null);
            if (taskObject == null) {
                log.info("Task not found for referenceId: {} during secondary stage end trigger check", referenceId);
                return;
            }
            String filingNumber = JsonPath.read(taskObject.toString(), FILING_NUMBER_PATH);

            // Map entity type to secondary stage and task management types
            String secondaryStage = mapEntityTypeToSecondaryStage(entityType);
            List<String> taskTypes = mapEntityTypeToTaskTypes(entityType);

            if (secondaryStage == null || taskTypes == null || taskTypes.isEmpty()) {
                log.info("No secondary stage mapping for entityType: {}", entityType);
                return;
            }

            evaluateTaskEndTrigger(filingNumber, tenantId, secondaryStage, taskTypes, request);
        } catch (Exception e) {
            log.error("Error processing task end trigger for referenceId: {}, entityType: {}", referenceId, entityType, e);
        }
    }

    /**
     * Evaluates whether a task management workflow event triggers a secondary stage end.
     * Called when a task-management-payment workflow transition occurs.
     *
     * @param referenceId the task management number
     * @param tenantId    tenant ID
     * @param request     the JSONObject request containing RequestInfo
     */
    public void processTaskManagementEndTrigger(String referenceId, String tenantId, JSONObject request) {
        try {
            RequestInfo requestInfo = mapper.readValue(request.getJSONObject("RequestInfo").toString(), RequestInfo.class);
            TaskSearchCriteria searchCriteria = TaskSearchCriteria.builder()
                    .tenantId(config.getStateLevelTenantId())
                    .taskManagementNumber(referenceId)
                    .build();
            TaskSearchRequest searchRequest = TaskSearchRequest.builder()
                    .requestInfo(requestInfo)
                    .criteria(searchCriteria)
                    .build();
            List<TaskManagement> tasks = taskManagementUtil.searchTaskManagement(searchRequest);
            if (tasks.isEmpty()) {
                log.info("Task management not found for referenceId: {} during secondary stage end trigger check", referenceId);
                return;
            }
            TaskManagement task = tasks.get(0);
            String filingNumber = task.getFilingNumber();
            String taskType = task.getTaskType();

            // Map taskType to secondary stage
            String entityType = "task-" + taskType.toLowerCase();
            String secondaryStage = mapEntityTypeToSecondaryStage(entityType);
            List<String> taskTypes = mapEntityTypeToTaskTypes(entityType);

            if (secondaryStage == null || taskTypes == null || taskTypes.isEmpty()) {
                log.info("No secondary stage mapping for task management taskType: {}", taskType);
                return;
            }

            evaluateTaskEndTrigger(filingNumber, tenantId, secondaryStage, taskTypes, request);
        } catch (Exception e) {
            log.error("Error processing task management end trigger for referenceId: {}", referenceId, e);
        }
    }

    /**
     * Core logic for evaluating whether all tasks of a given type have completed delivery,
     * triggering the end of the corresponding secondary stage.
     *
     * @param filingNumber   case filing number
     * @param tenantId       tenant ID
     * @param secondaryStage the secondary stage to potentially end
     * @param taskTypes      the task management taskType(s) to search for
     * @param request        the JSONObject request containing RequestInfo
     */
    private void evaluateTaskEndTrigger(String filingNumber, String tenantId, String secondaryStage, List<String> taskTypes, JSONObject request) {
        try {
            // Check if the secondary stage is currently active
            List<String> activeStages = caseStageTrackingUtil.getActiveSecondaryStageNames(filingNumber);
            if (!activeStages.contains(secondaryStage)) {
                log.info("Secondary stage '{}' is not active for filingNumber: {}, skipping end trigger check", secondaryStage, filingNumber);
                return;
            }

            // Search task management for all records of the given types for this filing number
            RequestInfo requestInfo = mapper.readValue(request.getJSONObject("RequestInfo").toString(), RequestInfo.class);
            TaskSearchCriteria searchCriteria = TaskSearchCriteria.builder()
                    .tenantId(config.getStateLevelTenantId())
                    .filingNumber(filingNumber)
                    .taskType(taskTypes)
                    .build();
            TaskSearchRequest searchRequest = TaskSearchRequest.builder()
                    .requestInfo(requestInfo)
                    .criteria(searchCriteria)
                    .build();

            List<TaskManagement> tasks = taskManagementUtil.searchTaskManagement(searchRequest);

            if (tasks.isEmpty()) {
                log.info("No task management records found for filingNumber: {} and taskTypes: {}", filingNumber, taskTypes);
                return;
            }

            // Check if all tasks have their delivery status updated or have completed
            boolean allCompleted = tasks.stream().allMatch(this::isTaskDeliveryCompleted);

            if (allCompleted) {
                log.info("All {} tasks completed/delivered for filingNumber: {}, ending secondary stage '{}'", taskTypes, filingNumber, secondaryStage);
                caseStageTrackingUtil.endSecondaryStage(filingNumber, secondaryStage);
                manageNAStage(filingNumber, tenantId);
                publishSubstageUpdate(filingNumber, tenantId, request);
            } else {
                log.info("Not all {} tasks completed for filingNumber: {}, secondary stage '{}' remains active", taskTypes, filingNumber, secondaryStage);
            }
        } catch (Exception e) {
            log.error("Error evaluating task end trigger for filingNumber: {}, secondaryStage: {}", filingNumber, secondaryStage, e);
        }
    }

    /**
     * Evaluates whether the Proclamation & Attachment secondary stage should end
     * because the accused has joined the case.
     * Called from join-case event processing.
     *
     * @param filingNumber case filing number
     * @param tenantId     tenant ID
     * @param request      the JSONObject request containing RequestInfo
     */
    public void processJoinCaseSecondaryStage(String filingNumber, String tenantId, JSONObject request) {
        try {
            List<String> activeStages = caseStageTrackingUtil.getActiveSecondaryStageNames(filingNumber);
            if (activeStages.contains(SECONDARY_STAGE_PROCLAMATION_AND_ATTACHMENT)) {
                log.info("Accused joined case, ending secondary stage '{}' for filingNumber: {}", SECONDARY_STAGE_PROCLAMATION_AND_ATTACHMENT, filingNumber);
                caseStageTrackingUtil.endSecondaryStage(filingNumber, SECONDARY_STAGE_PROCLAMATION_AND_ATTACHMENT);
                manageNAStage(filingNumber, tenantId);
                publishSubstageUpdate(filingNumber, tenantId, request);
            }
        } catch (Exception e) {
            log.error("Error processing join case secondary stage for filingNumber: {}", filingNumber, e);
        }
    }

    /**
     * Manages the N/A secondary stage.
     * - If no other secondary stages are active, starts N/A.
     * - If other secondary stages are active and N/A is active, ends N/A.
     *
     * @param filingNumber case filing number
     * @param tenantId     tenant ID
     */
    private void manageNAStage(String filingNumber, String tenantId) {
        try {
            List<String> activeStages = caseStageTrackingUtil.getActiveSecondaryStageNames(filingNumber);
            boolean naActive = activeStages.contains(SECONDARY_STAGE_NA);
            boolean hasOtherStages = activeStages.stream()
                    .anyMatch(s -> !SECONDARY_STAGE_NA.equals(s));

            if (hasOtherStages && naActive) {
                // End N/A since other stages are now active
                log.info("Other secondary stages active, ending N/A for filingNumber: {}", filingNumber);
                caseStageTrackingUtil.endSecondaryStage(filingNumber, SECONDARY_STAGE_NA);
            } else if (!hasOtherStages && !naActive) {
                // Start N/A since no other stages are active
                log.info("No other secondary stages active, starting N/A for filingNumber: {}", filingNumber);
                caseStageTrackingUtil.startSecondaryStage(filingNumber, tenantId, SECONDARY_STAGE_NA);
            }
        } catch (Exception e) {
            log.error("Error managing N/A secondary stage for filingNumber: {}", filingNumber, e);
        }
    }

    /**
     * Checks if a task management record has completed delivery.
     * A task is considered delivery-completed if:
     * 1. Its status is COMPLETED, OR
     * 2. All delivery channels in all party details have a non-null/non-empty deliveryStatus
     */
    private boolean isTaskDeliveryCompleted(TaskManagement task) {
        if ("COMPLETED".equalsIgnoreCase(task.getStatus())) {
            return true;
        }

        List<PartyDetails> partyDetailsList = task.getPartyDetails();
        if (partyDetailsList == null || partyDetailsList.isEmpty()) {
            return false;
        }

        for (PartyDetails party : partyDetailsList) {
            List<DeliveryChannel> channels = party.getDeliveryChannels();
            if (channels == null || channels.isEmpty()) {
                return false;
            }
            for (DeliveryChannel channel : channels) {
                if (channel.getDeliveryStatus() == null || channel.getDeliveryStatus().isEmpty()) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * Maps a task business service (entityType) to the corresponding secondary stage name.
     */
    private String mapEntityTypeToSecondaryStage(String entityType) {
        if (entityType == null) return null;
        switch (entityType.toLowerCase()) {
            case "task-summons": return SECONDARY_STAGE_SUMMONS;
            case "task-warrant": return SECONDARY_STAGE_WARRANT;
            case "task-proclamation":
            case "task-attachment": return SECONDARY_STAGE_PROCLAMATION_AND_ATTACHMENT;
            case "task-notice": return SECONDARY_STAGE_NOTICE;
            default: return null;
        }
    }

    /**
     * Maps a task business service (entityType) to the task management taskType(s) to search for.
     */
    private List<String> mapEntityTypeToTaskTypes(String entityType) {
        if (entityType == null) return null;
        switch (entityType.toLowerCase()) {
            case "task-summons": return List.of("SUMMONS");
            case "task-warrant": return List.of("WARRANT");
            case "task-proclamation": return List.of("PROCLAMATION");
            case "task-attachment": return List.of("ATTACHMENT");
            case "task-notice": return List.of("NOTICE");
            default: return null;
        }
    }

    /**
     * Computes the current secondary stages from active secondary stages and publishes a CaseOverallStatus update.
     * If no secondary stages are active, secondaryStage is set to empty list.
     * If one or more are active, secondaryStage is set to the list of active stage names.
     */
    private void publishSubstageUpdate(String filingNumber, String tenantId, JSONObject request) {
        try {
            List<String> activeStages = caseStageTrackingUtil.getActiveSecondaryStageNames(filingNumber);

            RequestInfo requestInfo = mapper.readValue(request.getJSONObject("RequestInfo").toString(), RequestInfo.class);

            CaseOverallStatus caseOverallStatus = new CaseOverallStatus();
            caseOverallStatus.setFilingNumber(filingNumber);
            caseOverallStatus.setTenantId(tenantId);
            caseOverallStatus.setSecondaryStage(activeStages);

            Object caseObject = caseUtil.getCase(request, config.getStateLevelTenantId(), null, filingNumber, null);

            String caseStage = JsonPath.read(caseObject.toString(), CASE_STAGE_PATH);
            String caseStageBackup = JsonPath.read(caseObject.toString(), CASE_STAGE_BACKUP_PATH);
            String caseSubStageBackup = JsonPath.read(caseObject.toString(), CASE_SUB_STAGE_BACKUP_PATH);

            caseOverallStatus.setStage(caseStage);
            caseOverallStatus.setStageBackup(caseStageBackup);
            caseOverallStatus.setSubstageBackup(caseSubStageBackup);

            AuditDetails auditDetails = new AuditDetails();
            String lastModifiedBy = (requestInfo.getUserInfo() != null && requestInfo.getUserInfo().getUuid() != null)
                    ? requestInfo.getUserInfo().getUuid() : "SYSTEM";
            auditDetails.setLastModifiedBy(lastModifiedBy);
            auditDetails.setLastModifiedTime(System.currentTimeMillis());
            caseOverallStatus.setAuditDetails(auditDetails);

            CaseStageSubStage caseStageSubStage = new CaseStageSubStage(requestInfo, caseOverallStatus);
            log.info("Publishing secondary stage update to kafka topic: {}, secondaryStage: '{}' for filingNumber: {}", config.getCaseOverallStatusTopic(), activeStages, filingNumber);
            producer.push(config.getCaseOverallStatusTopic(), caseStageSubStage);
        } catch (Exception e) {
            log.error("Error publishing secondary stage update for filingNumber: {}", filingNumber, e);
        }
    }
}
