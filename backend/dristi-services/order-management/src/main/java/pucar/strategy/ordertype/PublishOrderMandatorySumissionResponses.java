package pucar.strategy.ordertype;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.strategy.OrderUpdateStrategy;
import pucar.util.CaseUtil;
import pucar.util.DateUtil;
import pucar.util.JsonUtil;
import pucar.util.PendingTaskUtil;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.courtCase.CaseCriteria;
import pucar.web.models.courtCase.CaseSearchRequest;
import pucar.web.models.courtCase.CourtCase;
import pucar.web.models.pendingtask.PendingTask;
import pucar.web.models.pendingtask.PendingTaskRequest;

import java.util.*;

import static pucar.config.ServiceConstants.*;

@Slf4j
@Component
public class PublishOrderMandatorySumissionResponses implements OrderUpdateStrategy {

    private final PendingTaskUtil pendingTaskUtil;
    private final JsonUtil jsonUtil;
    private final DateUtil dateUtil;
    private final CaseUtil caseUtil ;

    @Autowired
    public PublishOrderMandatorySumissionResponses(PendingTaskUtil pendingTaskUtil, JsonUtil jsonUtil, DateUtil dateUtil, CaseUtil caseUtil) {
        this.pendingTaskUtil = pendingTaskUtil;
        this.jsonUtil = jsonUtil;
        this.dateUtil = dateUtil;
        this.caseUtil = caseUtil;
    }

    @Override
    public boolean supportsPreProcessing(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public boolean supportsPostProcessing(OrderRequest orderRequest) {
        Order order = orderRequest.getOrder();
        String action = order.getWorkflow().getAction();
        return order.getOrderType() != null && E_SIGN.equalsIgnoreCase(action) && MANDATORY_SUBMISSIONS_RESPONSES.equalsIgnoreCase(order.getOrderType());
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

        // case search

        List<CourtCase> cases = caseUtil.getCaseDetailsForSingleTonCriteria(CaseSearchRequest.builder()
                .criteria(Collections.singletonList(CaseCriteria.builder().filingNumber(order.getFilingNumber()).tenantId(order.getTenantId()).defaultFields(false).build()))
                .requestInfo(requestInfo).build());

        // add validation here
        CourtCase courtCase = cases.get(0);

        String submissionDueDate = jsonUtil.getNestedValue(order.getAdditionalDetails(), Arrays.asList("formdata", "submissionDeadline"), String.class);
        log.info("submissionDueDate:{}", submissionDueDate);
        Long sla = dateUtil.getEpochFromDateString(submissionDueDate, "yyyy-MM-dd");
        Boolean responseRequired = jsonUtil.getNestedValue(order.getAdditionalDetails(), Arrays.asList("formdata", "responseInfo", "isResponseRequired", "code"), Boolean.class);
        String entityType = "application-order-submission-default";
        if (responseRequired) {
            entityType = "application-order-submission-feedback";
        }


        ArrayNode assignees = pendingTaskUtil.getAssigneeDetailsForMakeMandatorySubmission(order.getAdditionalDetails());
        log.info("no of pending task for assignees:{}", assignees.size());
        for (JsonNode assignee : assignees) {
            ObjectNode assigneeNode = (ObjectNode) assignee;
            String itemId = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("itemId"), String.class);
            itemId = itemId != null ? itemId + "_" : "";

            String pendingTaskReferenceId = MANUAL + itemId + assigneeNode.get("individualId").asText() + "_" + assigneeNode.get("uuid").asText() + "_" + order.getOrderNumber();

            Map<String, Object> additionalDetailsMap = new HashMap<>();
            additionalDetailsMap.put("litigants", Collections.singletonList(assignee.get("individualId").asText()));
            additionalDetailsMap.put("litigantUuid", Collections.singletonList(assignee.get("partyUuid").asText()));
            // create pending task
            PendingTask pendingTask = PendingTask.builder()
                    .name(MAKE_MANDATORY_SUBMISSION)
                    .referenceId(pendingTaskReferenceId)
                    .entityType(entityType)
                    .status("CREATE_SUBMISSION")
                    .assignedTo(List.of(User.builder().uuid(assigneeNode.get("uuid").asText()).build()))
                    .cnrNumber(courtCase.getCnrNumber())
                    .filingNumber(courtCase.getFilingNumber())
                    .caseId(courtCase.getId().toString())
                    .caseTitle(courtCase.getCaseTitle())
                    .isCompleted(false)
                    .stateSla(sla)
                    .additionalDetails(additionalDetailsMap)
                    .screenType("home")
                    .build();

            pendingTaskUtil.createPendingTask(PendingTaskRequest.builder().requestInfo(requestInfo
            ).pendingTask(pendingTask).build());
        }

        log.info("After order publish process,result = SUCCESS, orderType :{}, orderNumber:{}", order.getOrderType(), order.getOrderNumber());

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
