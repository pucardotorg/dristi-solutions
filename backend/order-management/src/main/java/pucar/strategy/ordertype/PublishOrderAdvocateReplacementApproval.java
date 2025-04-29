package pucar.strategy.ordertype;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.stereotype.Component;
import pucar.strategy.OrderUpdateStrategy;
import pucar.util.JsonUtil;
import pucar.util.TaskUtil;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.WorkflowObject;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.task.*;

import java.util.Arrays;
import java.util.List;

import static pucar.config.ServiceConstants.ADVOCATE_REPLACEMENT_APPROVAL;
import static pucar.config.ServiceConstants.E_SIGN;


@Component
@Slf4j
public class PublishOrderAdvocateReplacementApproval implements OrderUpdateStrategy {

    private final TaskUtil taskUtil;
    private final JsonUtil jsonUtil;

    public PublishOrderAdvocateReplacementApproval(TaskUtil taskUtil, JsonUtil jsonUtil) {
        this.taskUtil = taskUtil;
        this.jsonUtil = jsonUtil;
    }

    @Override
    public boolean supportsPreProcessing(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public boolean supportsPostProcessing(OrderRequest orderRequest) {
        Order order = orderRequest.getOrder();
        String action = order.getWorkflow().getAction();
        return order.getOrderType() != null && E_SIGN.equalsIgnoreCase(action) && ADVOCATE_REPLACEMENT_APPROVAL.equalsIgnoreCase(order.getOrderType());
    }

    @Override
    public OrderRequest preProcess(OrderRequest orderRequest) {
        return null;
    }

    @Override
    public OrderRequest postProcess(OrderRequest orderRequest) {

        Order order = orderRequest.getOrder();
        RequestInfo requestInfo = orderRequest.getRequestInfo();
        log.info("After order publish process,result = IN_PROGRESS, orderType :{}, orderNumber:{}", order.getOrderType(), order.getOrderNumber());


        String taskNumber = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("taskNumber"), String.class);

        log.info("Search task for task Number:{}", taskNumber);
        TaskListResponse taskListResponse = taskUtil.searchTask(TaskSearchRequest.builder().requestInfo(requestInfo)
                .criteria(TaskCriteria.builder().tenantId(order.getTenantId()).taskNumber(taskNumber).build()).build());

        Task taskNeedToUpdate = taskListResponse.getList().get(0);

        // update task
        String action = jsonUtil.getNestedValue(order.getAdditionalDetails(), Arrays.asList("formdata", "replaceAdvocateStatus", "code"), String.class);
        // Determine task status based on action
        String taskAction = "GRANT".equalsIgnoreCase(action) ? "APPROVE" : "REJECT";

        WorkflowObject workflowObject = new WorkflowObject();
        workflowObject.setAction(taskAction);

        taskNeedToUpdate.setWorkflow(workflowObject);
        log.info("Updating task with action :{}", taskAction);
        taskUtil.updateTask(TaskRequest.builder().requestInfo(requestInfo).task(taskNeedToUpdate).build());
        log.info("After order publish process,result = SUCCESS, orderType :{}, orderNumber:{}", order.getOrderType(), order.getOrderNumber());

        return null;
    }

    @Override
    public boolean supportsCommon(OrderRequest request) {
        return false;
    }

    @Override
    public CaseDiaryEntry execute(OrderRequest request) {
        return null;
    }
}
