package digit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import digit.web.models.Bail;
import digit.web.models.BailRequest;
import digit.web.models.BailSearchCriteria;
import digit.web.models.BailSearchRequest;
import digit.web.models.ProcessInstanceObject;
import digit.web.models.RequestInfoWrapper;
import digit.web.models.WorkflowObject;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.Workflow;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.common.contract.workflow.ProcessInstance;
import org.egov.common.contract.workflow.ProcessInstanceRequest;
import org.egov.common.contract.workflow.ProcessInstanceResponse;
import org.egov.common.contract.workflow.State;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static digit.config.ServiceConstants.WORKFLOW_SERVICE_EXCEPTION;

@Service
@Slf4j
@AllArgsConstructor
public class WorkflowService {

    private ServiceRequestRepository repository;
    private Configuration config;
    private ObjectMapper mapper;

    public void updateWorkflowStatus(BailRequest bailRequest) {
        try {
            ProcessInstanceObject processInstance = getProcessInstance(bailRequest.getBail());
            ProcessInstanceRequest workflowRequest = new ProcessInstanceRequest(bailRequest.getRequestInfo(), Collections.singletonList(processInstance));
            log.info("ProcessInstance Request :: {}", workflowRequest);
            State workflowState = callWorkFlow(workflowRequest);
            if (workflowState == null || workflowState.getState() == null) {
                throw new CustomException(WORKFLOW_SERVICE_EXCEPTION, "Workflow state is null");
            }
            String state = workflowState.getState();
            log.info("Workflow State for filing number :: {} and state :: {}",bailRequest.getBail().getFilingNumber(), state);
            bailRequest.getBail().setStatus(state);
        } catch(CustomException e){
            throw e;
        } catch (Exception e) {
            log.error("Error updating workflow status :: {}", e.toString());
            throw new CustomException(WORKFLOW_SERVICE_EXCEPTION,"Error updating workflow status: "+e.getMessage());
        }
    }
    public State callWorkFlow(ProcessInstanceRequest workflowReq) {
        try {
            StringBuilder url = new StringBuilder(config.getWfHost().concat(config.getWfTransitionPath()));
            Object optional = repository.fetchResult(url, workflowReq);
            log.info("Workflow Response :: {}", optional);
            ProcessInstanceResponse response = mapper.convertValue(optional, ProcessInstanceResponse.class);
            if(response == null || CollectionUtils.isEmpty(response.getProcessInstances())) {
                throw new CustomException(WORKFLOW_SERVICE_EXCEPTION, "No process instances in workflow response");
            }
            return response.getProcessInstances().get(0).getState();
        } catch(CustomException e){
            throw e;
        } catch (Exception e) {
            log.error("Error calling workflow :: {}", e.toString());
            throw new CustomException(WORKFLOW_SERVICE_EXCEPTION,e.getMessage());
        }
    }

    public ProcessInstanceObject getProcessInstance(Bail bail) {
        try {
            WorkflowObject workflow = bail.getWorkflow();
            ProcessInstanceObject processInstance = new ProcessInstanceObject();
            processInstance.setBusinessId(bail.getBailId());
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
        } catch (Exception e) {
            log.error("Error getting process instance for BAIL :: {}", e.toString());
            throw new CustomException(WORKFLOW_SERVICE_EXCEPTION,e.getMessage());
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
        } catch (Exception e) {
            log.error("Error getting current workflow :: {}", e.toString());
            throw new CustomException(WORKFLOW_SERVICE_EXCEPTION, e.getMessage());
        }
    }

    private StringBuilder getSearchURLForProcessInstanceWithParams(String tenantId, String businessService) {
        StringBuilder url = new StringBuilder(config.getWfHost());
        url.append(config.getWfProcessInstanceSearchPath());
        url.append("?tenantId=").append(tenantId);
        url.append("&businessIds=").append(businessService);
        return url;
    }
    public ProcessInstanceRequest getProcessInstanceRegistrationPayment(BailRequest bailRequest) {
        try {
            Bail application = bailRequest.getBail();
            ProcessInstance process = ProcessInstance.builder()
                    .businessService("ADV")
                    .businessId(application.getBailId())
                    .comment("Payment for Bail registration processed")
                    .moduleName("bail-bond")
                    .tenantId(application.getTenantId())
                    .action("PAY")
                    .build();
            return ProcessInstanceRequest.builder()
                    .requestInfo(bailRequest.getRequestInfo())
                    .processInstances(Arrays.asList(process))
                    .build();
        } catch(CustomException e){
            throw e;
        } catch (Exception e) {
            log.error("Error getting process instance for case registration payment :: {}", e.toString());
            throw new CustomException(WORKFLOW_SERVICE_EXCEPTION, e.getMessage());
        }
    }

    public ProcessInstanceRequest getProcessInstanceForCasePayment(BailSearchRequest updateRequest, String tenantId) {

        BailSearchCriteria bailCriteria = updateRequest.getCriteria();

        ProcessInstance process = ProcessInstance.builder()
                .businessService(config.getBailBusinessServiceName())
                .businessId(bailCriteria.getFilingNumber())
                .comment("Payment for Case processed")
                .moduleName(config.getBailBusinessName())
                .tenantId(tenantId)
                .action("") //todo
                .build();

        return ProcessInstanceRequest.builder()
                .requestInfo(updateRequest.getRequestInfo())
                .processInstances(Arrays.asList(process))
                .build();

    }

    public Workflow getWorkflowFromProcessInstance(ProcessInstance processInstance) {
        if(processInstance == null) {
            return null;
        }
        return Workflow.builder().action(processInstance.getState().getState()).comments(processInstance.getComment()).build();
    }
}
