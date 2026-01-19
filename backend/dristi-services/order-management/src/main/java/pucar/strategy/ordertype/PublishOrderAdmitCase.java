package pucar.strategy.ordertype;


import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.config.Configuration;
import pucar.strategy.OrderUpdateStrategy;
import pucar.util.CaseUtil;
import pucar.util.HearingUtil;
import pucar.util.PendingTaskUtil;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.WorkflowObject;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.courtCase.*;
import pucar.web.models.pendingtask.PendingTask;
import pucar.web.models.pendingtask.PendingTaskRequest;

import java.util.Collections;
import java.util.List;

import static pucar.config.ServiceConstants.*;

@Component
@Slf4j
public class PublishOrderAdmitCase implements OrderUpdateStrategy {

    private final CaseUtil caseUtil;
    private final HearingUtil hearingUtil;
    private final Configuration config;
    private final PendingTaskUtil pendingTaskUtil;

    @Autowired
    public PublishOrderAdmitCase(CaseUtil caseUtil, HearingUtil hearingUtil, Configuration config, PendingTaskUtil pendingTaskUtil) {
        this.caseUtil = caseUtil;
        this.hearingUtil = hearingUtil;
        this.config = config;
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

        return order.getOrderType() != null && E_SIGN.equalsIgnoreCase(action) && TAKE_COGNIZANCE.equalsIgnoreCase(order.getOrderType());
    }

    @Override
    public boolean supportsCommon(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public CaseDiaryEntry execute(OrderRequest request) {
        return null;
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

        // case search and update
        List<CourtCase> cases = caseUtil.getCaseDetailsForSingleTonCriteria(CaseSearchRequest.builder()
                .criteria(Collections.singletonList(CaseCriteria.builder().filingNumber(order.getFilingNumber()).tenantId(order.getTenantId()).defaultFields(false).build()))
                .requestInfo(requestInfo).build());

        // add validation here
        CourtCase courtCase = cases.get(0);

        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction(ADMIT);
        courtCase.setWorkflow(workflow);

        log.info("Admitting the case with filing number:{}", courtCase.getFilingNumber());
        caseUtil.updateCase(CaseRequest.builder().cases(courtCase).requestInfo(requestInfo).build());

        // pending response pending task

        List<Party> respondent = caseUtil.getRespondentOrComplainant(courtCase, "respondent");
        log.info("creating pending task of pending response for respondent of size:{}", respondent.size());
        for (Party party : respondent) {

            String referenceId = MANUAL + "PENDING_RESPONSE_" + courtCase.getFilingNumber() + "_" + party.getIndividualId();
            PendingTask pendingTask = PendingTask.builder()
                    .name(PENDING_RESPONSE)
                    .referenceId(referenceId)
                    .entityType("case-default")
                    .status("PENDING_RESPONSE")
                    .assignedRole(List.of("CASE_RESPONDER"))
                    .cnrNumber(courtCase.getCnrNumber())
                    .filingNumber(courtCase.getFilingNumber())
                    .caseId(courtCase.getId().toString())
                    .caseTitle(courtCase.getCaseTitle())
                    .isCompleted(true)
                    .screenType("home")
                    .build();

            pendingTaskUtil.createPendingTask(PendingTaskRequest.builder().requestInfo(requestInfo
            ).pendingTask(pendingTask).build());
        }

        log.info("After order publish process,result = SUCCESS, orderType :{}, orderNumber:{}", order.getOrderType(), order.getOrderNumber());

        return null;
    }


}
