package pucar.strategy.ordertype;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.strategy.OrderUpdateStrategy;
import pucar.util.DateUtil;
import pucar.util.JsonUtil;
import pucar.util.PendingTaskUtil;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.pendingtask.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

import static pucar.config.ServiceConstants.EXTENSION_OF_DOCUMENT_SUBMISSION_DATE;
import static pucar.config.ServiceConstants.E_SIGN;


@Component
@Slf4j
public class PublishOrderExtensionOfDocumentSubmissionDate implements OrderUpdateStrategy {

    private final JsonUtil jsonUtil;
    private final DateUtil dateUtil;
    private final PendingTaskUtil pendingTaskUtil;


    @Autowired
    public PublishOrderExtensionOfDocumentSubmissionDate(JsonUtil jsonUtil, DateUtil dateUtil, PendingTaskUtil pendingTaskUtil) {
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
        Order order = orderRequest.getOrder();
        String action = order.getWorkflow().getAction();
        return order.getOrderType() != null  && E_SIGN.equalsIgnoreCase(action) &&  EXTENSION_OF_DOCUMENT_SUBMISSION_DATE.equalsIgnoreCase(order.getOrderType());
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

        log.info("Search Pending Task for filingNumber:{}", order.getFilingNumber());
        HashMap<String, Object> moduleSearchCriteria = new HashMap<>();
        moduleSearchCriteria.put("filingNumber", order.getFilingNumber());
        moduleSearchCriteria.put("isCompleted", false);

        InboxRequest searchRequest = InboxRequest.builder()
                .RequestInfo(requestInfo)
                .inbox(InboxSearchCriteria.builder()
                        .tenantId(order.getTenantId())
                        .processSearchCriteria(ProcessInstanceSearchCriteria.builder()
                                .moduleName("Pending Tasks Service")
                                .businessService(List.of("hearing-default")).build())
                        .moduleSearchCriteria(
                                moduleSearchCriteria
                        )
                        .limit(10)
                        .offset(0).build()).build();

        String submissionDueDate = jsonUtil.getNestedValue(order.getAdditionalDetails(), Arrays.asList("formdata", "newSubmissionDate"), String.class);

        Long sla = dateUtil.getEpochFromDateString(submissionDueDate, "yyyy-MM-dd");

        log.info("updating sla for pending task, sla:{}", sla);
        List<PendingTask> pendingTaskList = pendingTaskUtil.getPendingTask(searchRequest);

        if (!pendingTaskList.isEmpty()) {
            pendingTaskList.stream()
                    .filter(pendingTask ->
                            pendingTask.getReferenceId() != null &&
                                    order.getLinkedOrderNumber() != null &&
                                    pendingTask.getReferenceId().contains(order.getLinkedOrderNumber())
                    )
                    .forEach(pendingTask -> {
                        log.info("updating sla for pending task, referenceId:{}", pendingTask.getReferenceId());
                        pendingTask.setStateSla(sla);
                        pendingTaskUtil.createPendingTask(
                                PendingTaskRequest.builder()
                                        .pendingTask(pendingTask)
                                        .requestInfo(requestInfo)
                                        .build()
                        );
                    });

        }

        log.info("After order publish process for orderType :{},result = SUCCESS, , orderNumber:{}", order.getOrderType(), order.getOrderNumber());
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
