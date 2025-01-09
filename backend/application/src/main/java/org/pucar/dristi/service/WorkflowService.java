package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.Workflow;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.common.contract.user.UserDetailResponse;
import org.egov.common.contract.user.UserSearchRequest;
import org.egov.common.contract.workflow.ProcessInstance;
import org.egov.common.contract.workflow.ProcessInstanceRequest;
import org.egov.common.contract.workflow.ProcessInstanceResponse;
import org.egov.common.contract.workflow.State;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.util.UserUtil;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.pucar.dristi.config.ServiceConstants.*;

@Component
@Slf4j
public class WorkflowService {
    private final ObjectMapper mapper;
    private final ServiceRequestRepository repository;
    private final Configuration config;
    private final UserUtil userUtil;

    @Autowired
    public WorkflowService(
            ObjectMapper mapper,
            ServiceRequestRepository repository,
            Configuration config,
            UserUtil userUtil) {
        this.mapper = mapper;
        this.repository = repository;
        this.config = config;
        this.userUtil = userUtil;
    }


    public void updateWorkflowStatus(ApplicationRequest applicationRequest) {
        Application application = applicationRequest.getApplication();
        try {
            ProcessInstance processInstance = getProcessInstance(application, applicationRequest.getRequestInfo());
            ProcessInstanceRequest workflowRequest = new ProcessInstanceRequest(applicationRequest.getRequestInfo(), Collections.singletonList(processInstance));
            log.info("ProcessInstance Request :: {}", workflowRequest);
            String state = callWorkFlow(workflowRequest).getState();
            log.info("Application Status :: {}", state);
            application.setStatus(state);
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating workflow status: {}", e.getMessage());
            throw new CustomException(WORKFLOW_SERVICE_EXCEPTION, "Error updating workflow status: " + e.getMessage());
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

    private ProcessInstance getProcessInstance(Application application, RequestInfo requestInfo) {
        try {
            Workflow workflow = application.getWorkflow();
            ProcessInstance processInstance = new ProcessInstance();
            processInstance.setBusinessId(application.getApplicationNumber());
            processInstance.setAction(workflow.getAction());
            processInstance.setModuleName("pucar");
            processInstance.setTenantId(application.getTenantId());
            processInstance.setBusinessService(getBusinessServiceFromAppplication(application, requestInfo));
            processInstance.setDocuments(workflow.getDocuments());
            processInstance.setComment(workflow.getComments());
            if (!CollectionUtils.isEmpty(workflow.getAssignes())) {
                List<User> users = getUserListFromUserUuid(workflow.getAssignes());
                processInstance.setAssignes(users);
            }
            return processInstance;
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error getting process instance for Application: {}", e.getMessage());
            throw new CustomException(WORKFLOW_SERVICE_EXCEPTION, e.getMessage());
        }
    }

    String getBusinessServiceFromAppplication(Application application, RequestInfo requestInfo) {
        try {
        ProcessInstance processInstance = getCurrentWorkflow(requestInfo, application.getTenantId(), application.getApplicationNumber());

        if (processInstance == null) {
            log.info("Selecting business service for start action");
            if (DELAY_CONDONATION.equalsIgnoreCase(application.getApplicationType())) {
                log.info("Delay condonation application");
                if (isJudge(requestInfo)){
                    log.info("Delay condonation application by Judge");
                    return config.getDelayCondonationBusinessServiceName();
                }
                else if (isCitizen(requestInfo)){
                    log.info("Delay condonation application by Citizen");
                    return config.getAsyncVoluntarySubBusinessServiceName();
                }
            } else if (REQUEST_FOR_BAIL.equalsIgnoreCase(application.getApplicationType())) {
                log.info("Bail voluntary submission application");
                return config.getBailVoluntarySubBusinessServiceName();
            } else if (SUBMIT_BAIL_DOCUMENTS.equalsIgnoreCase(application.getApplicationType())) {
                log.info("Bail doc voluntary submission application");
                return config.getBailDocVoluntarySubBusinessServiceName();
            } else if (application.getReferenceId() == null) {
                log.info("Async voluntary submission application");
                return config.getAsyncVoluntarySubBusinessServiceName();
            } else if (application.isResponseRequired()) {
                log.info("Async order submission application with response");
                return config.getAsyncOrderSubWithResponseBusinessServiceName();
            } else {
                log.info("Async order submission application");
                return config.getAsyncOrderSubBusinessServiceName();
            }
        }
        return processInstance.getBusinessService();
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error getting business service: {}", e.getMessage());
            throw new CustomException(WORKFLOW_SERVICE_EXCEPTION, e.getMessage());
        }
    }

    private boolean isJudge(RequestInfo requestInfo) {
        return requestInfo.getUserInfo().getRoles().stream().anyMatch(role -> JUDGE_ROLE.equalsIgnoreCase(role.getCode()));
    }

    private boolean isCitizen(RequestInfo requestInfo) {
        return requestInfo.getUserInfo().getRoles().stream().anyMatch(role -> CITIZEN_UPPER.equalsIgnoreCase(role.getCode()));
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
            log.error("Error getting current workflow: {}", e.getMessage());
            throw new CustomException(WORKFLOW_SERVICE_EXCEPTION, e.getMessage());
        }
    }

    public ProcessInstanceRequest getProcessInstanceForApplicationPayment(ApplicationSearchRequest updateRequest, String tenantId, String businessService) {

        ApplicationCriteria criteria = updateRequest.getCriteria();

        String businessName = getBusinessName(businessService);

        ProcessInstance process = ProcessInstance.builder()
                .businessService(businessService)
                .businessId(criteria.getApplicationNumber())
                .comment("Payment for Application processed")
                .moduleName(businessName) // Use the retrieved business name
                .tenantId(tenantId)
                .action("PAY")
                .build();

        return ProcessInstanceRequest.builder()
                .requestInfo(updateRequest.getRequestInfo())
                .processInstances(Arrays.asList(process))
                .build();
    }

    private String getBusinessName(String businessService) {
        if (businessService.equals(config.getAsyncOrderSubBusinessServiceName())) {
            return config.getAsyncOrderSubBusinessName();
        } else if (businessService.equals(config.getAsyncOrderSubWithResponseBusinessServiceName())) {
            return config.getAsyncOrderSubWithResponseBusinessName();
        } else if (businessService.equals(config.getAsyncVoluntarySubBusinessServiceName())) {
            return config.getAsyncVoluntarySubBusinessName();
        } else if (businessService.equals(config.getBailVoluntarySubBusinessServiceName())) {
            return config.getBailVoluntarySubBusinessName();
        } else {
            throw new CustomException("INVALID_BUSINESS_SERVICE",
                    "No business name found for the business service: " + businessService);
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
        if (processInstance == null) {
            return null;
        }
        return Workflow.builder().action(processInstance.getState().getState()).comments(processInstance.getComment()).build();
    }

    public List<User> getUserListFromUserUuid(List<String> uuids) {
        List<User> users = new ArrayList<>();
        if (!CollectionUtils.isEmpty(uuids)) {
            UserSearchRequest userSearchRequest = new UserSearchRequest();
            userSearchRequest.setUuid(uuids);
            StringBuilder uri = new StringBuilder(config.getUserHost()).append(config.getUserSearchEndpoint());
            UserDetailResponse userDetailResponse = userUtil.userCall(userSearchRequest, uri);
            if (userDetailResponse != null && !CollectionUtils.isEmpty(userDetailResponse.getUser())) {
                users = userDetailResponse.getUser().stream().map(user -> User.builder().uuid(user.getUuid()).roles(user.getRoles()).build()).toList();
            }
        }
        return users;
    }
}
