package pucar.strategy;

import org.egov.common.contract.request.RequestInfo;
import org.springframework.stereotype.Component;
import pucar.util.PendingTaskUtil;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.pendingtask.IndexSearchCriteria;
import pucar.web.models.pendingtask.PendingTask;
import pucar.web.models.pendingtask.PendingTaskSearchRequest;

import java.util.HashMap;
import java.util.List;

import static pucar.config.ServiceConstants.MANUAL;


@Component
public class ExtensionOfDocumentSubmissionDate implements OrderUpdateStrategy {


    private final PendingTaskUtil pendingTaskUtil;

    public ExtensionOfDocumentSubmissionDate(PendingTaskUtil pendingTaskUtil) {
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

        Order order = orderRequest.getOrder();
        RequestInfo requestInfo = orderRequest.getRequestInfo();

        HashMap<String, Object> moduleSearchCriteria = new HashMap<>();
        moduleSearchCriteria.put("filingNumber", order.getFilingNumber());
        moduleSearchCriteria.put("isCompleted", false);
        moduleSearchCriteria.put("referenceId",MANUAL+order.getLinkedOrderNumber());

        PendingTaskSearchRequest searchRequest = PendingTaskSearchRequest.builder()
                .RequestInfo(requestInfo)
                .indexSearchCriteria(IndexSearchCriteria.builder()
                        .tenantId(order.getTenantId())
                        .moduleName("Pending Tasks Service")
                        .moduleSearchCriteria(
                                moduleSearchCriteria

                        ).build()).build();


        List<PendingTask> pendingTaskList = pendingTaskUtil.getPendingTask(searchRequest);

        if(!pendingTaskList.isEmpty()){
            PendingTask pendingTask = pendingTaskList.get(0);
            pendingTask.setStateSla(10L);  /// write logic here
        }


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
    // no search
    // no application search


    // search pending task using get field inbox     reference id = order.linked order number
    // new submission date order additional details
    // create pending task

}
