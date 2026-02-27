package org.pucar.dristi.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import org.egov.common.contract.models.Workflow;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.common.contract.workflow.ProcessInstance;
import org.egov.common.contract.workflow.ProcessInstanceRequest;
import org.egov.common.contract.workflow.ProcessInstanceResponse;
import org.egov.common.contract.workflow.State;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class WorkflowService {

    private ObjectMapper mapper;

    private ServiceRequestRepository repository;

    private Configuration config;

    @Autowired
    public WorkflowService(ObjectMapper mapper, ServiceRequestRepository repository, Configuration config) {
        this.mapper = mapper;
        this.repository = repository;
        this.config = config;
    }

    public void updateWorkflowStatus(CtcApplication ctcApplication, RequestInfo requestInfo) {
        try {
            ProcessInstanceObject processInstance = getProcessInstance(ctcApplication);
            ProcessInstanceRequest workflowRequest = new ProcessInstanceRequest(requestInfo, Collections.singletonList(processInstance));
            log.info("ProcessInstance Request :: {}", workflowRequest);
            String state=callWorkFlow(workflowRequest).getState();
            log.info("Workflow State for ctc application number :: {} and state :: {}",ctcApplication.getCtcApplicationNumber(), state);
            ctcApplication.setStatus(state);
        } catch(CustomException e){
            throw e;
        } catch (Exception e) {
            log.error("Error updating workflow status :: {}", e.toString());
            throw new CustomException("WORKFLOW_SERVICE_EXCEPTION","Error updating workflow status: "+e.getMessage());
        }
    }

    public State callWorkFlow(ProcessInstanceRequest workflowReq) {
        try {
            StringBuilder url = new StringBuilder(config.getWfHost().concat(config.getWfTransitionPath()));
            Object optional = repository.fetchResult(url, workflowReq);
            log.info("Workflow Response :: {}", optional);
            ProcessInstanceResponse response = mapper.convertValue(optional, ProcessInstanceResponse.class);
            return response.getProcessInstances().get(0).getState();
        } catch(CustomException e){
            throw e;
        } catch (Exception e) {
            log.error("Error calling workflow :: {}", e.toString());
            throw new CustomException("WORKFLOW_SERVICE_EXCEPTION",e.getMessage());
        }
    }

    public ProcessInstanceObject getProcessInstance(CtcApplication ctcApplication) {
        try {
            WorkflowObject workflow = ctcApplication.getWorkflow();
            ProcessInstanceObject processInstance = new ProcessInstanceObject();
            processInstance.setBusinessId(ctcApplication.getFilingNumber());
            processInstance.setAction(workflow.getAction());
            processInstance.setModuleName(config.getCtcBusinessName());
            processInstance.setTenantId(ctcApplication.getTenantId());
            processInstance.setBusinessService(config.getCtcBusinessServiceName());
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
        } catch (Exception e) {
            log.error("Error getting process instance for CASE :: {}", e.toString());
            throw new CustomException("WORKFLOW_SERVICE_EXCEPTION",e.getMessage());
        }
    }

    private StringBuilder getSearchURLForProcessInstanceWithParams(String tenantId, String businessService) {
        StringBuilder url = new StringBuilder(config.getWfHost());
        url.append(config.getWfProcessInstanceSearchPath());
        url.append("?tenantId=").append(tenantId);
        url.append("&businessIds=").append(businessService);
        return url;
    }


    public Workflow getWorkflowFromProcessInstance(ProcessInstance processInstance) {
        if(processInstance == null) {
            return null;
        }
        return Workflow.builder().action(processInstance.getState().getState()).comments(processInstance.getComment()).build();
    }
}
