package digit.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import digit.web.models.*;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.common.contract.workflow.ProcessInstanceRequest;
import org.egov.common.contract.workflow.ProcessInstanceResponse;
import org.egov.common.contract.workflow.State;
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

    public void updateWorkflowStatus(DigitalizedDocumentRequest documentRequest) {

        try {
            RequestInfo requestInfo = documentRequest.getRequestInfo();
            DigitalizedDocument digitalizedDocument = documentRequest.getDigitalizedDocument();
            ProcessInstanceObject processInstance = getDigitalizedDocumentProcessInstance(digitalizedDocument);
            ProcessInstanceRequest workflowRequest = new ProcessInstanceRequest(requestInfo, Collections.singletonList(processInstance));
            State state = callWorkFlow(workflowRequest);
            digitalizedDocument.setStatus(state.getState());
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
            throw new CustomException(WORKFLOW_SERVICE_EXCEPTION, e.toString());
        }
    }

    private ProcessInstanceObject getDigitalizedDocumentProcessInstance(DigitalizedDocument digitalizedDocument) {
        WorkflowObject workflow = digitalizedDocument.getWorkflow();

        ProcessInstanceObject processInstance = new ProcessInstanceObject();
        processInstance.setBusinessId(digitalizedDocument.getDocumentNumber());
        processInstance.setAction(workflow.getAction());
        processInstance.setModuleName(config.getDigitalizedDocumentModuleName());
        processInstance.setTenantId(digitalizedDocument.getTenantId());
        processInstance.setBusinessService(getDigitalizedDocumentBusinessService(digitalizedDocument));
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

    }

    private String getDigitalizedDocumentBusinessService(DigitalizedDocument document) {

        TypeEnum type = document.getType();

        return switch (type) {
            case MEDIATION -> config.getMediationDigitalizedDocumentBusinessService();
            case PLEA -> config.getPleaDigitalizedDocumentBusinessService();
            case EXAMINATION_OF_ACCUSED -> config.getExaminationOfAccusedDigitalizedDocumentBusinessService();
        };
    }

}
