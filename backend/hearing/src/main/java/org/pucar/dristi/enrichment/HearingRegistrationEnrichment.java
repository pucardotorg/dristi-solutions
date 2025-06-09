package org.pucar.dristi.enrichment;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.util.IdgenUtil;
import org.pucar.dristi.util.WorkflowUtil;
import org.pucar.dristi.web.models.Hearing;
import org.pucar.dristi.web.models.HearingRequest;
import org.pucar.dristi.web.models.ProcessInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

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
            enrichHearingDuration(hearingRequest);
        } catch (Exception e) {
            log.error("Error enriching hearing application upon update: {}", e.getMessage());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error in hearing enrichment service during hearing update process: " + e.getMessage());
        }
    }

    private void enrichHearingDuration(HearingRequest hearingRequest) {

        String workflowAction = hearingRequest.getHearing().getWorkflow().getAction();

        if (!CLOSE.equalsIgnoreCase(workflowAction)) {
            return;
        }
        try {
            // if hearing status moves to complete then, we need to calculate the duration
            List<ProcessInstance> processInstance = workflowUtil.getProcessInstance(hearingRequest.getRequestInfo(), hearingRequest.getHearing().getTenantId(), hearingRequest.getHearing().getHearingId());
            Long hearingDuration = 0L;
            for (int i = processInstance.size() - 1; i >= 0; i--) {
                if (processInstance.get(i) != null) {
                    String action = processInstance.get(i).getAction();
                    if (START.equalsIgnoreCase(action)) {
                        for (int j = i - 1; j >= 0; j--) {
                            if (processInstance.get(j) != null) {
                                String otherAction = processInstance.get(j).getAction();
                                if (PASS_OVER.equalsIgnoreCase(otherAction)) {
                                    Long passOverTime = processInstance.get(j).getAuditDetails().getCreatedTime();
                                    Long startTime = processInstance.get(i).getAuditDetails().getCreatedTime();
                                    hearingDuration = hearingDuration + (passOverTime - startTime);

                                } else if (ABANDON.equalsIgnoreCase(otherAction)) {
                                    hearingDuration = null;
                                    break;
                                }
                            }
                            i--;
                        }
                        if (hearingDuration == null) {
                            break;
                        }
                    }

                }
            }

            if (hearingDuration != null ) {
                String action = processInstance.get(0).getAction();
                if (START.equalsIgnoreCase(action)) {
                    hearingDuration = hearingDuration + System.currentTimeMillis() - processInstance.get(0).getAuditDetails().getCreatedTime();
                }
            }

            hearingRequest.getHearing().setHearingDurationInMillis(hearingDuration);
        } catch (Exception e) {
            log.error("Error enriching hearing duration: {}", e.getMessage());
        }

    }
}
