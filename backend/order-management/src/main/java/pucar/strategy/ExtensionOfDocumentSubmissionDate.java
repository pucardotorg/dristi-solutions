package pucar.strategy;

import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.util.DateUtil;
import pucar.util.JsonUtil;
import pucar.util.PendingTaskUtil;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.pendingtask.IndexSearchCriteria;
import pucar.web.models.pendingtask.PendingTask;
import pucar.web.models.pendingtask.PendingTaskRequest;
import pucar.web.models.pendingtask.PendingTaskSearchRequest;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;


@Component
public class ExtensionOfDocumentSubmissionDate implements OrderUpdateStrategy {

    private final JsonUtil jsonUtil;
    private final DateUtil dateUtil;
    private final PendingTaskUtil pendingTaskUtil;


    @Autowired
    public ExtensionOfDocumentSubmissionDate(JsonUtil jsonUtil, DateUtil dateUtil, PendingTaskUtil pendingTaskUtil) {
        this.jsonUtil = jsonUtil;
        this.dateUtil = dateUtil;
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
//        moduleSearchCriteria.put("referenceId",MANUAL+order.getLinkedOrderNumber());

        PendingTaskSearchRequest searchRequest = PendingTaskSearchRequest.builder()
                .RequestInfo(requestInfo)
                .indexSearchCriteria(IndexSearchCriteria.builder()
                        .tenantId(order.getTenantId())
                        .moduleName("Pending Tasks Service")
                        .moduleSearchCriteria(
                                moduleSearchCriteria

                        ).build()).build();

        String submissionDueDate = jsonUtil.getNestedValue(order.getAdditionalDetails(), Arrays.asList("formdata", "submissionDeadline"), String.class);

        Long sla = dateUtil.getEpochFromDateString(submissionDueDate, "yyyy-MM-dd");


        List<PendingTask> pendingTaskList = pendingTaskUtil.getPendingTask(searchRequest);

        if (!pendingTaskList.isEmpty()) {
            pendingTaskList.stream()
                    .filter(pendingTask ->
                            pendingTask.getReferenceId() != null &&
                                    order.getLinkedOrderNumber() != null &&
                                    pendingTask.getReferenceId().contains(order.getLinkedOrderNumber())
                    )
                    .forEach(pendingTask -> {
                        pendingTask.setStateSla(sla);
                        pendingTaskUtil.createPendingTask(
                                PendingTaskRequest.builder()
                                        .pendingTask(pendingTask)
                                        .requestInfo(requestInfo)
                                        .build()
                        );
                    });

        }


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

}
