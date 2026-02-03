package org.pucar.dristi.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.workflow.Assignee;
import org.pucar.dristi.web.models.workflow.AssigneeRequest;
import org.pucar.dristi.web.models.workflow.AssigneeResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
public class WorkflowUtil {

    private final Configuration config;
    private final ServiceRequestRepository requestRepository;
    private final ObjectMapper mapper;

    @Autowired
    public WorkflowUtil(Configuration config, ServiceRequestRepository requestRepository, ObjectMapper mapper) {
        this.config = config;
        this.requestRepository = requestRepository;
        this.mapper = mapper;
    }

    public AssigneeResponse upsertAssignees(RequestInfo requestInfo, Set<String> assigneeUuids, String processInstanceId, String tenantId) {
        if (assigneeUuids == null || assigneeUuids.isEmpty()) {
            log.warn("No assignee UUIDs provided for workflow upsert");
            return null;
        }

        if (processInstanceId == null || processInstanceId.isEmpty()) {
            log.warn("No processInstanceId provided for workflow upsert");
            return null;
        }

        try {
            List<Assignee> assignees = new ArrayList<>();
            for (String uuid : assigneeUuids) {
                Assignee assignee = Assignee.builder()
                        .processInstanceId(processInstanceId)
                        .tenantId(tenantId)
                        .assignee(uuid)
                        .isActive(true)
                        .build();
                assignees.add(assignee);
            }

            AssigneeRequest assigneeRequest = AssigneeRequest.builder()
                    .requestInfo(requestInfo)
                    .assignees(assignees)
                    .build();

            StringBuilder uri = new StringBuilder();
            uri.append(config.getWorkflowHost()).append(config.getWorkflowAssigneeUpsertEndpoint());

            log.info("Calling workflow assignee upsert API for processInstanceId: {} with {} assignees", processInstanceId, assigneeUuids.size());
            
            Object response = requestRepository.fetchResult(uri, assigneeRequest);
            AssigneeResponse assigneeResponse = mapper.convertValue(response, AssigneeResponse.class);
            
            log.info("Successfully upserted {} assignees to workflow service", assigneeResponse.getAssignees().size());
            return assigneeResponse;

        } catch (Exception e) {
            log.error("Error while calling workflow assignee upsert API for processInstanceId: {}", processInstanceId, e);
            throw new CustomException("WORKFLOW_ASSIGNEE_UPSERT_ERROR", "Failed to upsert assignees to workflow service: " + e.getMessage());
        }
    }
}
