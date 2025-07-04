package digit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import digit.web.models.*;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.common.contract.workflow.*;
import org.egov.common.contract.workflow.ProcessInstance;
import org.egov.common.contract.workflow.ProcessInstanceResponse;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static digit.config.ServiceConstants.APPLICATION_ACTIVE_STATUS;
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

    /**
     * For updating workflow status of bail by calling workflow
     *
     * @param bailRequest
     */
    public void updateWorkflowStatus(BailRequest bailRequest) {
        try {
            Bail bail = bailRequest.getBail();
            ProcessInstanceObject processInstance = getProcessInstanceForBail(bail);
            ProcessInstanceRequest workflowRequest = new ProcessInstanceRequest(bailRequest.getRequestInfo(), Collections.singletonList(processInstance));
            log.info("ProcessInstance Request :: {}", workflowRequest);
            State workflowState = callWorkFlow(workflowRequest);
            String state = workflowState.getState();
            log.info("Bail state :: {}", state);
            bail.setStatus(state);
            if (APPLICATION_ACTIVE_STATUS.equalsIgnoreCase(workflowState.getApplicationStatus())) {
                bail.setIsActive(true);
            }
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating workflow status: {}", e.toString());
            throw new CustomException(WORKFLOW_SERVICE_EXCEPTION, "Error updating workflow status: " + e);
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
            log.error("Error calling workflow: {}", e.toString());
            throw new CustomException(WORKFLOW_SERVICE_EXCEPTION, e.toString());
        }
    }

    /**
     * for bail application process instance
     *
     * @param bail
     * @return payload for workflow service call
     */
    ProcessInstanceObject getProcessInstanceForBail(Bail bail) {
        try {
            WorkflowObject workflow = bail.getWorkflow();
            ProcessInstanceObject processInstance = new ProcessInstanceObject();
            processInstance.setBusinessId(bail.getId());
            processInstance.setAction(workflow.getAction());
            processInstance.setModuleName(config.getBailBusinessName());
            processInstance.setTenantId(bail.getTenantId());
            processInstance.setBusinessService(config.getBailBusinessServiceName());
            processInstance.setDocuments(workflow.getDocuments());
            processInstance.setComment(workflow.getComments());
            processInstance.setAdditionalDetails(workflow.getAdditionalDetails());
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
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error getting process instance for BAIL: {}", e.toString());
            throw new CustomException(WORKFLOW_SERVICE_EXCEPTION, e.toString());
        }
    }

    public ProcessInstance getCurrentWorkflow(RequestInfo requestInfo, String tenantId, String businessId) {
        try {
            RequestInfoWrapper requestInfoWrapper = RequestInfoWrapper.builder().requestInfo(requestInfo).build();
            StringBuilder url = getSearchURLForProcessInstanceWithParams(tenantId, businessId);
            Object res = repository.fetchResult(url, requestInfoWrapper);
            ProcessInstanceResponse response = mapper.convertValue(res, ProcessInstanceResponse.class);
            if (response != null && !CollectionUtils.isEmpty(response.getProcessInstances()) && response.getProcessInstances().get(0) != null)
                return response.getProcessInstances().get(0);
            return null;
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error getting current workflow: {}", e.toString());
            throw new CustomException(WORKFLOW_SERVICE_EXCEPTION, e.toString());
        }
    }

    StringBuilder getSearchURLForProcessInstanceWithParams(String tenantId, String businessId) {
        StringBuilder url = new StringBuilder(config.getWfHost());
        url.append(config.getWfProcessInstanceSearchPath());
        url.append("?tenantId=").append(tenantId);
        url.append("&businessIds=").append(businessId);
        return url;
    }
}
