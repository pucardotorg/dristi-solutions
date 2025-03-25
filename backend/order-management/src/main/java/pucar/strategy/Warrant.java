package pucar.strategy;

import jakarta.validation.Valid;
import org.egov.common.contract.request.RequestInfo;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.WorkflowObject;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.task.Amount;
import pucar.web.models.task.Task;
import pucar.web.models.task.TaskRequest;

public class Warrant implements OrderUpdateStrategy {
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

        Order order = orderRequest.getOrder();
        RequestInfo requestInfo = orderRequest.getRequestInfo();

        TaskRequest taskRequest = TaskRequest.builder().build();
        Task task = Task.builder()
                .tenantId(order.getTenantId())
                .orderId(order.getId())
                .filingNumber(order.getFilingNumber())
                .cnrNumber(order.getCnrNumber())
                .createdDate(System.currentTimeMillis())  // this is ist
                .taskType(order.getOrderType())
                .taskDetails(getTaskDetails())
                .amount(Amount.builder().type("FINE").status("DONE")
                        .amount("getting from mdms").build())
                //
                .status("IN_PROGRESS")
                .isActive(true)
                .additionalDetails(getAdditionDetails())
                .workflow(getWorkflow())
                .build();


        return null;
    }

    @Override
    public boolean supportsCommon() {
        return false;
    }

    @Override
    public CaseDiaryEntry execute(OrderRequest request) {
        return null;
    }

    private @Valid WorkflowObject getWorkflow() {

        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction("CREATE");
        workflow.setComments("Order Type");
        return workflow;

    }

    private Object getAdditionDetails() {

        // orderdata.itemid
    }

    private Object getTaskDetails() {

        // order data and order form value
    }
}
