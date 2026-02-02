package org.egov.wf.service;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.egov.wf.config.WorkflowConfig;
import org.egov.wf.producer.Producer;
import org.egov.wf.web.models.Assignee;
import org.egov.wf.web.models.AssigneeRequest;
import org.egov.wf.web.models.AuditDetails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.List;

@Slf4j
@Service
public class AssigneeService {

    private final Producer producer;

    private final WorkflowConfig config;

    @Autowired
    public AssigneeService(Producer producer, WorkflowConfig config) {
        this.producer = producer;
        this.config = config;
    }

    public List<Assignee> upsertAssignees(AssigneeRequest request) {
        RequestInfo requestInfo = request.getRequestInfo();
        List<Assignee> assignees = request.getAssignees();

        if (CollectionUtils.isEmpty(assignees)) {
            throw new CustomException("INVALID_REQUEST", "Assignees list cannot be empty");
        }

        enrichAssignees(requestInfo, assignees);
        producer.push(assignees.get(0).getTenantId(), config.getUpsertAssigneeTopic(), request);

        return assignees;
    }

    private void enrichAssignees(RequestInfo requestInfo, List<Assignee> assignees) {
        String uuid = requestInfo.getUserInfo().getUuid();
        Long currentTime = System.currentTimeMillis();

        for (Assignee assignee : assignees) {
            if (assignee.getIsActive() == null) {
                assignee.setIsActive(true);
            }

            AuditDetails auditDetails = AuditDetails.builder()
                    .createdBy(uuid)
                    .createdTime(currentTime)
                    .lastModifiedBy(uuid)
                    .lastModifiedTime(currentTime)
                    .build();

            assignee.setAuditDetails(auditDetails);
        }
    }

}
