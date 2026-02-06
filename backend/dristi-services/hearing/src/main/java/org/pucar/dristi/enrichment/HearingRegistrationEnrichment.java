package org.pucar.dristi.enrichment;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.util.IdgenUtil;
import org.pucar.dristi.util.WorkflowUtil;
import org.pucar.dristi.web.models.Attendee;
import org.pucar.dristi.web.models.Hearing;
import org.pucar.dristi.web.models.HearingRequest;
import org.pucar.dristi.web.models.ProcessInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.ObjectUtils;

import java.util.List;
import java.util.UUID;

import static org.pucar.dristi.config.ServiceConstants.*;

@Component
@Slf4j
public class HearingRegistrationEnrichment {

    private IdgenUtil idgenUtil;
    private Configuration configuration;
    private final WorkflowUtil workflowUtil;

    @Autowired
    public HearingRegistrationEnrichment(IdgenUtil idgenUtil, Configuration configuration, WorkflowUtil workflowUtil) {
        this.idgenUtil = idgenUtil;
        this.configuration = configuration;
        this.workflowUtil = workflowUtil;
    }

    /**
     * Enrich the hearing application by setting values in different field
     *
     * @param hearingRequest the hearing registration request body
     */
    public void enrichHearingRegistration(HearingRequest hearingRequest) {
        try {
            Hearing hearing = hearingRequest.getHearing();
            AuditDetails auditDetails = AuditDetails.builder().createdBy(hearingRequest.getRequestInfo().getUserInfo().getUuid()).createdTime(System.currentTimeMillis()).lastModifiedBy(hearingRequest.getRequestInfo().getUserInfo().getUuid()).lastModifiedTime(System.currentTimeMillis()).build();
            hearing.setAuditDetails(auditDetails);
            hearing.setId(UUID.randomUUID());
            //setting false unless the application is approved
            hearing.setIsActive(false);
            if (hearing.getDocuments() != null) {
                hearing.getDocuments().forEach(document -> {
                    document.setId(String.valueOf(UUID.randomUUID()));
                    document.setDocumentUid(document.getId());
                });
            }
            String tenantId = hearing.getFilingNumber().get(0).replace("-", "");

            String idName = configuration.getHearingConfig();
            String idFormat = configuration.getHearingFormat();

            List<String> hearingIdList = idgenUtil.getIdList(hearingRequest.getRequestInfo(), tenantId, idName, idFormat, 1, false);
            hearing.setHearingId(hearing.getFilingNumber().get(0) + "-" + hearingIdList.get(0));

            enrichHearingAttendees(hearingRequest);

            if (null != hearing.getCourtCaseNumber())
                hearing.setCaseReferenceNumber(hearing.getCourtCaseNumber());
            else
                hearing.setCaseReferenceNumber(hearing.getCmpNumber());
        } catch (CustomException e) {
            log.error("Custom Exception occurred while Enriching hearing");
            throw e;
        } catch (Exception e) {
            log.error("Error enriching hearing application: {}", e.getMessage());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error hearing in enrichment service: " + e.getMessage());
        }

    }

    /**
     * Enrich the hearing application on update
     *
     * @param hearingRequest the hearing registration request body
     */
    public void enrichHearingApplicationUponUpdate(HearingRequest hearingRequest) {
        try {
            // Enrich lastModifiedTime and lastModifiedBy in case of update
            Hearing hearing = hearingRequest.getHearing();
            hearing.getAuditDetails().setLastModifiedTime(System.currentTimeMillis());
            hearing.getAuditDetails().setLastModifiedBy(hearingRequest.getRequestInfo().getUserInfo().getUuid());

            if (hearing.getDocuments() != null) {
                hearing.getDocuments().forEach(document -> {
                    if (document.getId() == null)
                        document.setId(String.valueOf(UUID.randomUUID()));
                });
            }
            enrichHearingAttendees(hearingRequest);
            enrichHearingDuration(hearingRequest);
        } catch (Exception e) {
            log.error("Error enriching hearing application upon update: {}", e.getMessage());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error in hearing enrichment service during hearing update process: " + e.getMessage());
        }
    }

    private void enrichHearingAttendees(HearingRequest hearingRequest) {
        try {
            Hearing hearing = hearingRequest.getHearing();
            List<Attendee> attendees = hearing.getAttendees();

            if (attendees != null && !attendees.isEmpty()) {
                attendees.forEach(attendee -> {
                    if(attendee.getId() == null)
                        attendee.setId(String.valueOf(UUID.randomUUID()));
                });
            }
        } catch (Exception e) {
            log.error("Error enriching hearing attendees upon update: {}", e.getMessage());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error in hearing enrichment service during hearing update process: " + e.getMessage());
        }
    }

    private void enrichHearingDuration(HearingRequest hearingRequest) {

        if (hearingRequest.getHearing().getWorkflow() == null || ObjectUtils.isEmpty(hearingRequest.getHearing().getWorkflow())) {
            return;
        }

        String workflowAction = hearingRequest.getHearing().getWorkflow().getAction();

        if (!CLOSE.equalsIgnoreCase(workflowAction)) {
            return;
        }
        try {
            // if hearing status moves to complete then, we need to calculate the duration
            List<ProcessInstance> processInstance = workflowUtil.getProcessInstance(hearingRequest.getRequestInfo(), hearingRequest.getHearing().getTenantId(), hearingRequest.getHearing().getHearingId());

            Long hearingDuration = 0L;
            Long activeStart = 0L;

            log.info("ProcessInstance :: {}", processInstance.size());
            for (int i = processInstance.size() - 1; i >= 0; i--) {
                if (processInstance.get(i) != null) {
                    String action = processInstance.get(i).getAction();
                    Long time = processInstance.get(i).getAuditDetails().getCreatedTime();

                    log.info("ProcessInstance action :: {}, createdTime :: {}", action, time);

                    if (START.equalsIgnoreCase(action)) {
                        activeStart = time;
                    }

                    else if (PASS_OVER.equalsIgnoreCase(action) && activeStart != null) {
                        hearingDuration += (time - activeStart);
                        activeStart = 0L;
                    }

                    else if (RESCHEDULE_ONGOING.equalsIgnoreCase(action)) {
                        hearingDuration = 0L;
                        activeStart = 0L;
                    }

                    else if (CLOSE.equalsIgnoreCase(action) && activeStart != null) {
                        hearingDuration += (time - activeStart);
                        activeStart = 0L;
                    }

                    else if (ABANDON.equalsIgnoreCase(action)) {
                        hearingDuration = 0L;
                        break;
                    }

                }
            }

            String action = processInstance.get(0).getAction();
            if (START.equalsIgnoreCase(action)) {
                Long currentTime = System.currentTimeMillis();
                log.info("Last action :: {}, createdTime :: {}", "CLOSE", currentTime);
                hearingDuration = hearingDuration + (currentTime - processInstance.get(0).getAuditDetails().getCreatedTime());
            }

            hearingRequest.getHearing().setHearingDurationInMillis(hearingDuration);
        } catch (Exception e) {
            log.error("Error enriching hearing duration: {}", e.getMessage());
        }

    }
}
