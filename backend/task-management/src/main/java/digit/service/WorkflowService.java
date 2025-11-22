package digit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import digit.web.models.TaskManagement;
import digit.web.models.TaskManagementRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.Workflow;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.common.contract.workflow.*;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static digit.config.ServiceConstants.WORKFLOW_SERVICE_EXCEPTION;

@Service
@Slf4j
public class WorkflowService {

    private final ObjectMapper mapper;
    private final ServiceRequestRepository repository;
    private final Configuration config;

    @Autowired
    public WorkflowService(ObjectMapper mapper, ServiceRequestRepository repository, Configuration config) {
        this.mapper = mapper;
        this.repository = repository;
        this.config = config;
    }

    public void updateWorkflowStatus(TaskManagementRequest taskManagementRequest) {

        try {
            RequestInfo requestInfo = taskManagementRequest.getRequestInfo();
            TaskManagement taskManagement = taskManagementRequest.getTaskManagement();
            ProcessInstance processInstance = getTaskManagementProcessInstance(taskManagement);
            ProcessInstanceRequest workflowRequest = new ProcessInstanceRequest(requestInfo, Collections.singletonList(processInstance));
            State state = callWorkFlow(workflowRequest);
            taskManagement.setStatus(state.getState());
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating workflow: {}", e.getMessage());
            throw new CustomException(WORKFLOW_SERVICE_EXCEPTION, e.getMessage());
        }

    }

    public State callWorkFlow(ProcessInstanceRequest workflowReq) {
        try {
            StringBuilder url = new StringBuilder(config.getWfHost().concat(config.getWfTransitionPath()));
            Object optional = repository.fetchResult(url, workflowReq);
            log.info("Workflow Response :: {}", optional);
            ProcessInstanceResponse response = mapper.convertValue(optional, ProcessInstanceResponse.class);
            return response.getProcessInstances().get(0).getState();
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error calling workflow: {}", e.getMessage());
            throw new CustomException(WORKFLOW_SERVICE_EXCEPTION, e.getMessage());
        }
    }

    private ProcessInstance getTaskManagementProcessInstance(TaskManagement taskManagement) {
        Workflow workflow = taskManagement.getWorkflow();

        ProcessInstance processInstance = new ProcessInstance();
        processInstance.setBusinessId(taskManagement.getTaskManagementNumber());
        processInstance.setAction(workflow.getAction());
        processInstance.setModuleName(config.getTaskBusinessName());
        processInstance.setTenantId(taskManagement.getTenantId());
        processInstance.setBusinessService(config.getTaskBusinessServiceName());
        processInstance.setDocuments(workflow.getDocuments());
        processInstance.setComment(workflow.getComments());

        if (!CollectionUtils.isEmpty(workflow.getAssignes())) {
            List<User> users = new ArrayList<>();

            workflow.getAssignes().forEach(uuid -> {
                User user = new User();
                user.setUuid(uuid);
                users.add(user);
            });

            processInstance.setAssignes(users);
        }

        return processInstance;

    }

}
