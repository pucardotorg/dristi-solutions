package org.egov.wf.service;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.egov.wf.config.WorkflowConfig;
import org.egov.wf.producer.Producer;
import org.egov.wf.repository.WorKflowRepository;
import org.egov.wf.web.models.Assignee;
import org.egov.wf.web.models.AssigneeRequest;
import org.egov.wf.web.models.AssigneeSearchCriteria;
import org.egov.wf.web.models.AuditDetails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.util.List;

@Slf4j
@Service
public class AssigneeService {

    private final Producer producer;

    private final WorkflowConfig config;

    private final WorKflowRepository workflowRepository;

    @Autowired
    public AssigneeService(Producer producer, WorkflowConfig config, WorKflowRepository workflowRepository) {
        this.producer = producer;
        this.config = config;
        this.workflowRepository = workflowRepository;
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

    /**
     * Searches for process instance IDs by assignee with optional filtering by businessService and states.
     * Only considers the latest process instance record (history = false behavior).
     * @param criteria The search criteria containing uuid, businessService, and states
     * @return List of process instance IDs matching the criteria
     */
    public List<String> searchProcessInstanceIdsByAssignee(AssigneeSearchCriteria criteria) {
        validateSearchCriteria(criteria);
        return workflowRepository.getProcessInstanceIdsByAssigneeSearch(criteria);
    }

    private void validateSearchCriteria(AssigneeSearchCriteria criteria) {
        if (criteria == null) {
            throw new CustomException("INVALID_REQUEST", "Search criteria cannot be null");
        }
        if (!StringUtils.hasText(criteria.getTenantId())) {
            throw new CustomException("INVALID_REQUEST", "TenantId is mandatory");
        }
        if (!StringUtils.hasText(criteria.getUuid())) {
            throw new CustomException("INVALID_REQUEST", "UUID is mandatory and cannot be empty");
        }
    }

}
