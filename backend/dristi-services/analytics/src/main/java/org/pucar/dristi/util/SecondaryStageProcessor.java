package org.pucar.dristi.util;

import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONArray;
import org.json.JSONObject;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.config.MdmsDataConfig;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.web.models.CaseOverallStatus;
import org.pucar.dristi.web.models.CaseStageSubStage;
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
import java.util.Set;

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
    public void processOrderSecondaryStage(String filingNumber, String tenantId, String orderType, String status, JSONObject request,Object caseObject) {
        try {
            if (orderType == null || status == null) return;

            // Start triggers: order type published triggers corresponding secondary stage
            if (ORDER_STATUS_PUBLISHED.equalsIgnoreCase(status)) {
                Map<String, String> orderTypeToSubstageMap = mdmsDataConfig.getOrderTypeToSubstageMap();
                String secondaryStage = mapOrderTypeToSecondaryStage(orderType, orderTypeToSubstageMap);
                if (secondaryStage != null) {
                    log.info("Order type '{}' published triggers secondary stage '{}' for filingNumber: {}", orderType, secondaryStage, filingNumber);
                    publishSubstageUpdate(filingNumber, tenantId, request,secondaryStage,caseObject);
                    caseStageTrackingUtil.startSecondaryStage(filingNumber, tenantId, secondaryStage);
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
                publishSubstageUpdate(filingNumber, tenantId, request,SECONDARY_STAGE_DELAY_CONDONATION,caseObject);
                caseStageTrackingUtil.startSecondaryStage(filingNumber, tenantId, SECONDARY_STAGE_DELAY_CONDONATION);
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
    public void processApplicationSecondaryStage(String filingNumber, String tenantId, String applicationType, String status, JSONObject request,Object caseObject) {
        try {
            if (applicationType == null || status == null) return;

            if (APPLICATION_DELAY_CONDONATION.equalsIgnoreCase(applicationType)) {
                // Delay Condonation is not mapped to orderType, handle it separately
                String delayCondonationStage = "Delay Condonation";
                
                if (APPLICATION_STATUS_ACCEPTED.equalsIgnoreCase(status) || APPLICATION_STATUS_REJECTED.equalsIgnoreCase(status)) {
                    // End trigger for Delay Condonation
                    log.info("Application '{}' status '{}' ends secondary stage '{}' for filingNumber: {}", applicationType, status, delayCondonationStage, filingNumber);
                    publishSubstageUpdate(filingNumber, tenantId, request,null,caseObject);
                    caseStageTrackingUtil.endSecondaryStage(filingNumber);
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
//    public void processHearingSecondaryStage(String filingNumber, String tenantId, String hearingType, JSONObject request) {
//        try {
//            if (hearingType == null) return;
//
//            // Mediation is not mapped to orderType, handle it separately
//            String mediationStage = "Mediation";
//
//            if (HEARING_PURPOSE_MEDIATION.equalsIgnoreCase(hearingType)) {
//                // Start trigger: hearing purpose is Mediation
//                log.info("Hearing purpose '{}' triggers secondary stage '{}' for filingNumber: {}", hearingType, mediationStage, filingNumber);
//                caseStageTrackingUtil.startSecondaryStage(filingNumber, tenantId, mediationStage);
//                manageNAStage(filingNumber, tenantId);
//                publishSubstageUpdate(filingNumber, tenantId, request);
//            } else {
//                // End trigger for Mediation: a new hearing with a different purpose is scheduled
//                List<String> activeStages = caseStageTrackingUtil.getActiveSecondaryStageNames(filingNumber);
//                if (activeStages.contains(mediationStage)) {
//                    log.info("New hearing with purpose '{}' ends secondary stage '{}' for filingNumber: {}", hearingType, mediationStage, filingNumber);
//                    caseStageTrackingUtil.endSecondaryStage(filingNumber, mediationStage);
//                    manageNAStage(filingNumber, tenantId);
//                    publishSubstageUpdate(filingNumber, tenantId, request);
//                }
//            }
//        } catch (Exception e) {
//            log.error("Error processing hearing secondary stage for filingNumber: {}, hearingType: {}", filingNumber, hearingType, e);
//        }
//    }

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
            String taskType = JsonPath.read(taskObject.toString(), "$.taskType");
            Object caseObject = caseUtil.getCase(request, config.getStateLevelTenantId(), null, filingNumber, null);

            // Map entity type to secondary stage and task management types
            String secondaryStage = mapTaskTypeToSecondaryStage(taskType);

            if (secondaryStage == null) {
                log.info("No secondary stage mapping for taskType: {}", taskType);
                return;
            }

            evaluateTaskEndTrigger(filingNumber, tenantId, secondaryStage, taskType, request,referenceId,caseObject);
        } catch (Exception e) {
            log.error("Error processing task end trigger for referenceId: {}, entityType: {}", referenceId, entityType, e);
        }
    }

    /**
     * Core logic for evaluating whether all tasks of a given type have been delivered or expired,
     * triggering the end of the corresponding secondary stage.
     * Uses the Task service instead of TaskManagement to check task status.
     *
     * @param filingNumber   case filing number
     * @param tenantId       tenant ID
     * @param secondaryStage the secondary stage to potentially end
     * @param taskType       the task type to search for (e.g., SUMMONS, WARRANT)
     * @param request        the JSONObject request containing RequestInfo
     */
    private void evaluateTaskEndTrigger(String filingNumber, String tenantId, String secondaryStage, String taskType, JSONObject request,String referenceId,Object caseObject) {
        try {
            // Check if the secondary stage is currently active
            List<String> activeStages = caseStageTrackingUtil.getActiveSecondaryStageNames(filingNumber);
            if (!activeStages.contains(secondaryStage)) {
                log.info("Secondary stage '{}' is not active for filingNumber: {}, skipping end trigger check", secondaryStage, filingNumber);
                return;
            }

            // Search tasks by filingNumber and taskType using Task service
            JSONArray tasks = taskUtil.getTasksByFilingNumberAndType(request, config.getStateLevelTenantId(), filingNumber, taskType);

            if (tasks == null || tasks.length() == 0) {
                log.info("No tasks found for filingNumber: {} and taskType: {}", filingNumber, taskType);
                return;
            }

            int completedCount = 0;
            for (int i = 0; i < tasks.length(); i++) {
                JSONObject task = tasks.getJSONObject(i);
                String status = task.optString("status", "");
                if(referenceId!=null && referenceId.equals(task.optString("taskNumber", ""))){
                    continue;
                }
                if (TASK_END_TRIGGER_STATUSES.contains(status)) {
                    completedCount++;
                }
            }

            if (((tasks.length() > 1 && completedCount==tasks.length()-1)) || (tasks.length() == 1)) {
                log.info("All {} tasks delivered/expired for filingNumber: {}, ending secondary stage '{}'", taskType, filingNumber, secondaryStage);
                publishSubstageUpdate(filingNumber, tenantId, request,null,caseObject);
                caseStageTrackingUtil.endSecondaryStage(filingNumber);
            } else {
                log.info("Not all {} tasks delivered/expired for filingNumber: {}, secondary stage '{}' remains active", taskType, filingNumber, secondaryStage);
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
    public void processJoinCaseSecondaryStage(String filingNumber, String tenantId, JSONObject request,Object caseObject) {
        try {
            List<String> activeStages = caseStageTrackingUtil.getActiveSecondaryStageNames(filingNumber);
            if (activeStages.contains(SECONDARY_STAGE_PROCLAMATION_AND_ATTACHMENT)) {
                log.info("Accused joined case, ending secondary stage '{}' for filingNumber: {}", SECONDARY_STAGE_PROCLAMATION_AND_ATTACHMENT, filingNumber);
                publishSubstageUpdate(filingNumber, tenantId, request,SECONDARY_STAGE_PROCLAMATION_AND_ATTACHMENT,caseObject);
                caseStageTrackingUtil.endSecondaryStage(filingNumber);
            }
        } catch (Exception e) {
            log.error("Error processing join case secondary stage for filingNumber: {}", filingNumber, e);
        }
    }



    /**
     * Maps a task business service (entityType) to the corresponding secondary stage name.
     */
    private String mapTaskTypeToSecondaryStage(String taskType) {
        if (taskType == null) return null;
        return switch (taskType) {
            case ORDER_TYPE_SUMMONS -> SECONDARY_STAGE_SUMMONS;
            case ORDER_TYPE_WARRANT -> SECONDARY_STAGE_WARRANT;
            case ORDER_TYPE_PROCLAMATION, ORDER_TYPE_ATTACHMENT -> SECONDARY_STAGE_PROCLAMATION_AND_ATTACHMENT;
            case ORDER_TYPE_NOTICE -> SECONDARY_STAGE_NOTICE;
            default -> null;
        };
    }


    /**
     * Computes the current secondary stages from active secondary stages and publishes a CaseOverallStatus update.
     * If no secondary stages are active, secondaryStage is set to empty list.
     * If one or more are active, secondaryStage is set to the list of active stage names.
     */
    private void publishSubstageUpdate(String filingNumber, String tenantId, JSONObject request,String secondaryStage,Object caseObject) {
        try {
            List<String> activeStages = caseStageTrackingUtil.getActiveSecondaryStageNames(filingNumber);
            if(!activeStages.contains(secondaryStage) && secondaryStage!=null){
                activeStages.add(secondaryStage);
            }
            if (secondaryStage==null || SECONDARY_STAGE_PROCLAMATION_AND_ATTACHMENT.equalsIgnoreCase(secondaryStage))
                activeStages.clear();

            RequestInfo requestInfo = mapper.readValue(request.getJSONObject("RequestInfo").toString(), RequestInfo.class);

            CaseOverallStatus caseOverallStatus = new CaseOverallStatus();
            caseOverallStatus.setFilingNumber(filingNumber);
            caseOverallStatus.setTenantId(tenantId);
            caseOverallStatus.setSecondaryStage(activeStages);

            String caseStage = JsonPath.read(caseObject.toString(), CASE_STAGE_PATH);
            String caseStageBackup = JsonPath.read(caseObject.toString(), CASE_STAGE_BACKUP_PATH);
            String caseSubStageBackup = JsonPath.read(caseObject.toString(), CASE_SUB_STAGE_BACKUP_PATH);

            if(STAGE_REGISTRATION.equalsIgnoreCase(caseStage) && SECONDARY_STAGE_DELAY_CONDONATION.equalsIgnoreCase(secondaryStage)){
                caseOverallStatus.setStage(STAGE_COGNIZANCE);
            }else {
                caseOverallStatus.setStage(caseStage);
            }
            if(STAGE_APPEARANCE.equalsIgnoreCase(caseStage) && SECONDARY_STAGE_PROCLAMATION_AND_ATTACHMENT.equalsIgnoreCase(secondaryStage)){
                caseOverallStatus.setStage(STAGE_BAIL_AND_RECORDING_OF_PLEA);
            }
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
