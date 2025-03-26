package pucar.strategy;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.util.DateUtil;
import pucar.util.JsonUtil;
import pucar.util.PendingTaskUtil;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.pendingtask.PendingTask;

import java.util.*;

import static pucar.config.ServiceConstants.MAKE_MANDATORY_SUBMISSION;
import static pucar.config.ServiceConstants.MANUAL;

@Component
public class MandatorySumissionResponses implements OrderUpdateStrategy {

    private final PendingTaskUtil pendingTaskUtil;
    private final JsonUtil jsonUtil;
    private final DateUtil dateUtil;

    @Autowired
    public MandatorySumissionResponses(PendingTaskUtil pendingTaskUtil, JsonUtil jsonUtil, DateUtil dateUtil) {
        this.pendingTaskUtil = pendingTaskUtil;
        this.jsonUtil = jsonUtil;
        this.dateUtil = dateUtil;
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

        String submissionDueDate = jsonUtil.getNestedValue(order.getAdditionalDetails(), Arrays.asList("formdata", "submissionDeadline"), String.class);

        Long sla = dateUtil.getEpochFromDateString(submissionDueDate, "yyyy-MM-dd");
        String responseRequired = jsonUtil.getNestedValue(order.getAdditionalDetails(), Arrays.asList("formdata", "isResponseRequired", "code"), String.class);
        String entityType = "application-order-submission-default";
        if (responseRequired.equalsIgnoreCase("Yes")) {
            entityType = "application-order-submission-feedback";
        }


        ArrayNode assignees = pendingTaskUtil.getAssigneeDetailsForMakeMandatorySubmission(order.getAdditionalDetails());
        for (JsonNode assignee : assignees) {
            ObjectNode assigneeNode = (ObjectNode) assignee;
            String itemId = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("itemId"), String.class);
            itemId = itemId != null ? itemId + "_" : "";

            String pendingTaskReferenceId = MANUAL + itemId + assigneeNode.get("individualId") + "_" + assigneeNode.get("uuid") + "_" + order.getOrderNumber();

            Map<String, Object> additionalDetailsMap = new HashMap<>();
            additionalDetailsMap.put("litigants", Collections.singletonList(assignee.get("individualId")));
            additionalDetailsMap.put("litigantUuid", Collections.singletonList(assignee.get("partyUuid")));
            // create pending task
            PendingTask pendingTask = PendingTask.builder()
                    .name(MAKE_MANDATORY_SUBMISSION)
                    .referenceId(pendingTaskReferenceId)
                    .entityType(entityType)
                    .status("CREATE_SUBMISSION")
                    .assignedTo(List.of(User.builder().uuid(assigneeNode.get("uuid").toString()).build()))
                    .cnrNumber(order.getCnrNumber())
                    .filingNumber(order.getFilingNumber())
                    .isCompleted(false)
                    .stateSla(sla)
                    .additionalDetails(additionalDetailsMap)
                    .screenType("home")
                    .build();
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

    // before publish order

    // no

    // after publish order

    // create submission pending task

}
