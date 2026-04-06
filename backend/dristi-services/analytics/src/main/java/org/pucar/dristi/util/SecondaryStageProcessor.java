package org.pucar.dristi.util;

import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.web.models.CaseOverallStatus;
import org.pucar.dristi.web.models.CaseStageSubStage;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

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

    @Autowired
    public SecondaryStageProcessor(CaseStageTrackingUtil caseStageTrackingUtil, Configuration config, Producer producer, ObjectMapper mapper, CaseUtil caseUtil) {
        this.caseStageTrackingUtil = caseStageTrackingUtil;
        this.config = config;
        this.producer = producer;
        this.mapper = mapper;
        this.caseUtil = caseUtil;
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
                String secondaryStage = mapOrderTypeToSecondaryStage(orderType);
                if (secondaryStage != null) {
                    log.info("Order type '{}' published triggers secondary stage '{}' for filingNumber: {}", orderType, secondaryStage, filingNumber);
                    caseStageTrackingUtil.startSecondaryStage(filingNumber, tenantId, secondaryStage);
                    publishSubstageUpdate(filingNumber, tenantId, request);
                }
            }
        } catch (Exception e) {
            log.error("Error processing order secondary stage for filingNumber: {}, orderType: {}", filingNumber, orderType, e);
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
                if (APPLICATION_STATUS_ACCEPTED.equalsIgnoreCase(status) || APPLICATION_STATUS_REJECTED.equalsIgnoreCase(status)) {
                    // End trigger for Delay Condonation
                    log.info("Application '{}' status '{}' ends secondary stage '{}' for filingNumber: {}", applicationType, status, SECONDARY_STAGE_DELAY_CONDONATION, filingNumber);
                    caseStageTrackingUtil.endSecondaryStage(filingNumber, SECONDARY_STAGE_DELAY_CONDONATION);
                    publishSubstageUpdate(filingNumber, tenantId, request);
                } else {
                    // Start trigger for Delay Condonation (application created/submitted)
                    log.info("Application '{}' triggers secondary stage '{}' for filingNumber: {}", applicationType, SECONDARY_STAGE_DELAY_CONDONATION, filingNumber);
                    caseStageTrackingUtil.startSecondaryStage(filingNumber, tenantId, SECONDARY_STAGE_DELAY_CONDONATION);
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

            if (HEARING_PURPOSE_MEDIATION.equalsIgnoreCase(hearingType)) {
                // Start trigger: hearing purpose is Mediation
                log.info("Hearing purpose '{}' triggers secondary stage '{}' for filingNumber: {}", hearingType, SECONDARY_STAGE_MEDIATION, filingNumber);
                caseStageTrackingUtil.startSecondaryStage(filingNumber, tenantId, SECONDARY_STAGE_MEDIATION);
                publishSubstageUpdate(filingNumber, tenantId, request);
            } else {
                // End trigger for Mediation: a new hearing with a different purpose is scheduled
                List<String> activeStages = caseStageTrackingUtil.getActiveSecondaryStageNames(filingNumber);
                if (activeStages.contains(SECONDARY_STAGE_MEDIATION)) {
                    log.info("New hearing with purpose '{}' ends secondary stage '{}' for filingNumber: {}", hearingType, SECONDARY_STAGE_MEDIATION, filingNumber);
                    caseStageTrackingUtil.endSecondaryStage(filingNumber, SECONDARY_STAGE_MEDIATION);
                    publishSubstageUpdate(filingNumber, tenantId, request);
                }
            }
        } catch (Exception e) {
            log.error("Error processing hearing secondary stage for filingNumber: {}, hearingType: {}", filingNumber, hearingType, e);
        }
    }

    /**
     * Maps an order type to the corresponding secondary stage name.
     *
     * @param orderType the order type
     * @return the secondary stage name, or null if no mapping exists
     */
    private String mapOrderTypeToSecondaryStage(String orderType) {
        if (orderType == null) return null;
        String upperOrderType = orderType.toUpperCase();

        if (upperOrderType.contains(ORDER_TYPE_NOTICE)) {
            return SECONDARY_STAGE_NOTICE;
        } else if (upperOrderType.contains(ORDER_TYPE_SUMMONS)) {
            return SECONDARY_STAGE_SUMMONS;
        } else if (upperOrderType.contains(ORDER_TYPE_WARRANT)) {
            return SECONDARY_STAGE_WARRANT;
        } else if (upperOrderType.contains(ORDER_TYPE_PROCLAMATION) || upperOrderType.contains(ORDER_TYPE_ATTACHMENT)) {
            return SECONDARY_STAGE_PROCLAMATION_AND_ATTACHMENT;
        }
        return null;
    }

    /**
     * Computes the current substage from active secondary stages and publishes a CaseOverallStatus update.
     * If no secondary stages are active, substage is set to "N/A".
     * If one or more are active, substage is set to a comma-separated list of active stage names.
     */
    private void publishSubstageUpdate(String filingNumber, String tenantId, JSONObject request) {
        try {
            List<String> activeStages = caseStageTrackingUtil.getActiveSecondaryStageNames(filingNumber);
            String substage;
            if (activeStages.isEmpty()) {
                substage = SECONDARY_STAGE_NA;
            } else {
                substage = String.join(", ", activeStages);
            }

            RequestInfo requestInfo = mapper.readValue(request.getJSONObject("RequestInfo").toString(), RequestInfo.class);

            CaseOverallStatus caseOverallStatus = new CaseOverallStatus();
            caseOverallStatus.setFilingNumber(filingNumber);
            caseOverallStatus.setTenantId(tenantId);
            caseOverallStatus.setSubstage(substage);

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
            log.info("Publishing substage update to kafka topic: {}, substage: '{}' for filingNumber: {}", config.getCaseOverallStatusTopic(), substage, filingNumber);
            producer.push(config.getCaseOverallStatusTopic(), caseStageSubStage);
        } catch (Exception e) {
            log.error("Error publishing substage update for filingNumber: {}", filingNumber, e);
        }
    }
}
