package pucar.strategy.ordertype;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.strategy.OrderUpdateStrategy;
import pucar.util.CaseUtil;
import pucar.util.JsonUtil;
import pucar.util.PendingTaskUtil;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.courtCase.*;
import pucar.web.models.pendingtask.PendingTask;
import pucar.web.models.pendingtask.PendingTaskRequest;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static pucar.config.ServiceConstants.*;


@Component
@Slf4j
public class PublishOrderApprovalRejectionLitigantDetailsChange implements OrderUpdateStrategy {

    private final CaseUtil caseUtil;
    private final JsonUtil jsonUtil;
    private final PendingTaskUtil pendingTaskUtil;

    @Autowired
    public PublishOrderApprovalRejectionLitigantDetailsChange(CaseUtil caseUtil, JsonUtil jsonUtil, PendingTaskUtil pendingTaskUtil) {
        this.caseUtil = caseUtil;
        this.jsonUtil = jsonUtil;
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
        return order.getOrderType() != null && E_SIGN.equalsIgnoreCase(action) && APPROVAL_REJECTION_LITIGANT_DETAILS_CHANGE.equalsIgnoreCase(order.getOrderType());
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

        List<CourtCase> cases = caseUtil.getCaseDetailsForSingleTonCriteria(CaseSearchRequest.builder()
                .criteria(Collections.singletonList(CaseCriteria.builder().filingNumber(order.getFilingNumber()).tenantId(order.getTenantId()).defaultFields(false).build()))
                .requestInfo(requestInfo).build());

        // add validation here
        CourtCase courtCase = cases.get(0);

        String action = jsonUtil.getNestedValue(order.getAdditionalDetails(), Arrays.asList("formdata", "applicationGrantedRejected", "code"), String.class);
        String caseAction = action.equalsIgnoreCase("REJECTED") ? "REJECT" : "ACCEPT";
        String pendingTaskRefId = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("pendingTaskRefId"), String.class);
        //create process

        ProcessInfo processInfo = ProcessInfo.builder()
                .caseId(courtCase.getId().toString())
                .tenantId(order.getTenantId())
                .pendingTaskRefId(pendingTaskRefId)
                .action(caseAction)
                .build();

        caseUtil.processProfileRequest(ProcessProfileRequest.builder()
                .requestInfo(requestInfo).processInfo(processInfo).build());

        // close pending task
        PendingTask pendingTask = PendingTask.builder()
                .isCompleted(true)
                .referenceId(pendingTaskRefId)
                .filingNumber(courtCase.getFilingNumber())
                .caseTitle(courtCase.getCaseTitle())
                .caseId(courtCase.getId().toString())
                .cnrNumber(courtCase.getCnrNumber())
                .status(PROFILE_EDIT_REQUEST).build();

        pendingTaskUtil.createPendingTask(PendingTaskRequest.builder().requestInfo(requestInfo)
                .pendingTask(pendingTask).build());

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
