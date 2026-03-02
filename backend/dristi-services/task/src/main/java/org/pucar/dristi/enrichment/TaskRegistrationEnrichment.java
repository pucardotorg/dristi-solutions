package org.pucar.dristi.enrichment;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.HrmsUtil;
import org.pucar.dristi.util.IdgenUtil;
import org.pucar.dristi.web.models.CourtCase;
import org.pucar.dristi.web.models.Task;
import org.pucar.dristi.web.models.TaskRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

import static org.pucar.dristi.config.ServiceConstants.*;

@Component
@Slf4j
public class TaskRegistrationEnrichment {

    private final IdgenUtil idgenUtil;
    private final Configuration config;
    private final ObjectMapper objectMapper;
    private final CaseUtil caseUtil;

    @Autowired
    public TaskRegistrationEnrichment(IdgenUtil idgenUtil, Configuration config, ObjectMapper objectMapper, CaseUtil caseUtil, HrmsUtil hrmsUtil) {
        this.idgenUtil = idgenUtil;
        this.config = config;
        this.objectMapper = objectMapper;
        this.caseUtil = caseUtil;
    }

    public void enrichTaskRegistration(TaskRequest taskRequest) {
        try {
            Task task = taskRequest.getTask();
            String tenantId = task.getFilingNumber().replace("-", "");

            String idName = config.getTaskConfig();
            String idFormat = config.getTaskFormat();

            List<String> taskRegistrationIdList = idgenUtil.getIdList(taskRequest.getRequestInfo(), tenantId, idName, idFormat, 1, false);
            log.info("Task Registration Id List :: {}", taskRegistrationIdList);

            AuditDetails auditDetails = AuditDetails.builder().createdBy(taskRequest.getRequestInfo().getUserInfo().getUuid()).createdTime(System.currentTimeMillis()).lastModifiedBy(taskRequest.getRequestInfo().getUserInfo().getUuid()).lastModifiedTime(System.currentTimeMillis()).build();
            task.setAuditDetails(auditDetails);

            task.setId(UUID.randomUUID());
            enrichCourtId(taskRequest);

            if (task.getDocuments() != null) {
                task.getDocuments().forEach(document -> {
                    document.setId(String.valueOf(UUID.randomUUID()));
                    document.setDocumentUid(document.getId());
                });
            }
            if (task.getAmount() != null) task.getAmount().setId(UUID.randomUUID());
            task.setCreatedDate(System.currentTimeMillis());
            task.setTaskNumber(taskRequest.getTask().getFilingNumber() + "-" + taskRegistrationIdList.get(0));


            if(JOIN_CASE_PAYMENT.equalsIgnoreCase(task.getTaskType())){
                enrichConsumerCodeInTaskDetails(task);
            }

            if (task.getCaseId() == null || task.getCaseTitle() == null) {
                enrichCaseDetails(taskRequest);
            }

        } catch (Exception e) {
            log.error("Error enriching task application :: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION, e.getMessage());
        }
    }

    private void enrichCaseDetails(TaskRequest taskRequest) {
        log.info("case details not found in task, enriching case details for task {}", taskRequest.getTask().getTaskNumber());
        List<CourtCase> cases = caseUtil.getCaseDetails(taskRequest);
        if (cases.isEmpty()) {
            log.error("No case found for the given task.");
            return;
        }
        String caseId = cases.get(0).getId().toString();
        String caseTitle = cases.get(0).getCaseTitle();
        taskRequest.getTask().setCaseTitle(caseTitle);
        taskRequest.getTask().setCaseId(caseId);
    }

    private void enrichCourtId(TaskRequest taskRequest) {

        taskRequest.getRequestInfo().getUserInfo().setType("EMPLOYEE");
        List<CourtCase> caseDetails = caseUtil.getCaseDetails(taskRequest);

        if (caseDetails.isEmpty()) {
            throw new CustomException(ENRICHMENT_EXCEPTION, "case not found");
        }
        String courtId = caseDetails.get(0).getCourtId();
        taskRequest.getTask().setCourtId(courtId);

    }

    private void enrichConsumerCodeInTaskDetails(Task task) {
        ObjectNode taskDetailsNode = objectMapper.convertValue(task.getTaskDetails(), ObjectNode.class);
        String consumerCode = task.getTaskNumber() + "_JOIN_CASE";

        taskDetailsNode.put("consumerCode",consumerCode);
        task.setTaskDetails(objectMapper.convertValue(taskDetailsNode, Object.class));
    }

    public void enrichCaseApplicationUponUpdate(TaskRequest taskRequest) {
        try {
            // Enrich lastModifiedTime and lastModifiedBy in case of update
            Task task = taskRequest.getTask();
            task.getAuditDetails().setLastModifiedTime(System.currentTimeMillis());
            task.getAuditDetails().setLastModifiedBy(taskRequest.getRequestInfo().getUserInfo().getUuid());
            if (task.getDocuments() != null) {
                task.getDocuments().removeIf(document -> document.getId() != null);
                task.getDocuments().forEach(document -> {
                    if (document.getId() == null) {
                        document.setId(UUID.randomUUID().toString());
                        document.setDocumentUid(document.getId());
                    }
                });
            }

            if (task.getCaseId() == null || task.getCaseTitle() == null) {
                enrichCaseDetails(taskRequest);
            }

        } catch (Exception e) {
            log.error("Error enriching task application upon update :: {}", e.toString());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Exception in task enrichment service during task update process: " + e.getMessage());
        }
    }

    public void enrichAuditDetailsForUpdate(Task task, RequestInfo requestInfo) {
        task.getAuditDetails().setLastModifiedTime(System.currentTimeMillis());
        task.getAuditDetails().setLastModifiedBy(requestInfo.getUserInfo().getUuid());
    }
}