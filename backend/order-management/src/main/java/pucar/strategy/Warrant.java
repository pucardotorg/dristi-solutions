package pucar.strategy;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.util.CaseUtil;
import pucar.util.PendingTaskUtil;
import pucar.util.TaskUtil;
import pucar.web.models.*;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.courtCase.CaseCriteria;
import pucar.web.models.courtCase.CaseSearchRequest;
import pucar.web.models.courtCase.CourtCase;
import pucar.web.models.pendingtask.PendingTask;
import pucar.web.models.pendingtask.PendingTaskRequest;
import pucar.web.models.task.*;

import java.util.List;

@Component
public class Warrant implements OrderUpdateStrategy {

    private final TaskUtil taskUtil;
    private final ObjectMapper objectMapper;
    private final CaseUtil caseUtil;
    private final PendingTaskUtil pendingTaskUtil;
    @Autowired
    public Warrant(TaskUtil taskUtil, ObjectMapper objectMapper, CaseUtil caseUtil, PendingTaskUtil pendingTaskUtil) {
        this.taskUtil = taskUtil;
        this.objectMapper = objectMapper;
        this.caseUtil = caseUtil;
        this.pendingTaskUtil = pendingTaskUtil;
    }

    @Override
    public boolean supportsPreProcessing(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public boolean supportsPostProcessing(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public OrderRequest preProcess(OrderRequest orderRequest) {
        return null;
    }

    @Override
    public OrderRequest postProcess(OrderRequest orderRequest) {
        List<CourtCase> courtCases = caseUtil.getCaseDetailsForSingleTonCriteria(CaseSearchRequest.builder()
                .requestInfo(orderRequest.getRequestInfo())
                .criteria(List.of(CaseCriteria.builder().tenantId(orderRequest.getOrder().getTenantId()).filingNumber(orderRequest.getOrder().getFilingNumber()).build())).build());
        createTask(courtCases.get(0), orderRequest.getOrder(), orderRequest.getRequestInfo());
        return null;
    }

    @Override
    public boolean supportsCommon(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public CaseDiaryEntry execute(OrderRequest request) {
        return null;
    }

    private WorkflowObject getWorkflow() {

        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction("CREATE");
        workflow.setComments("Order Type");
        return workflow;

    }

    public void createTask(CourtCase caseDetails, Order orderData, RequestInfo requestInfo) {
        try {
            Task task = Task.builder()
                    .createdDate(System.currentTimeMillis())
                    .orderId(orderData.getId())
                    .filingNumber(caseDetails.getFilingNumber())
                    .cnrNumber(caseDetails.getCnrNumber())
                    .taskType(orderData.getOrderType())
                    .status("IN_PROGRESS")
                    .tenantId(caseDetails.getTenantId())
                    .workflow(getWorkflow())
                    .amount(Amount.builder().type("FINE").status("DONE").build())
                    .build();

            JsonNode additionalDetails = objectMapper.convertValue(orderData.getAdditionalDetails(), JsonNode.class);
            JsonNode taskDetails = objectMapper.readTree(additionalDetails.get("taskDetails").asText());

            for(JsonNode taskObject: taskDetails) {
                task.setTaskDetails(taskObject);
                TaskResponse taskResponse = taskUtil.callCreateTask(TaskRequest.builder().requestInfo(requestInfo).task(task).build());
                pendingTaskUtil.createPendingTask(buildPendingTaskRequest(taskResponse, requestInfo));
            }
            TaskRequest.builder().task(task).build();
        } catch (IllegalArgumentException | JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    private PendingTaskRequest buildPendingTaskRequest(TaskResponse taskResponse, RequestInfo requestInfo) {
        Task task = taskResponse.getTask();
        return PendingTaskRequest.builder().requestInfo(requestInfo).pendingTask(PendingTask.builder()
                .filingNumber(task.getFilingNumber())
                .cnrNumber(task.getCnrNumber())
                .status(task.getStatus())
                .build()).build();
    }
}




