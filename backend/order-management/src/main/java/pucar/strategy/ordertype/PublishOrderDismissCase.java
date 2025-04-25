package pucar.strategy.ordertype;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.config.Configuration;
import pucar.strategy.OrderUpdateStrategy;
import pucar.util.CaseUtil;
import pucar.util.HearingUtil;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.WorkflowObject;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.courtCase.CaseCriteria;
import pucar.web.models.courtCase.CaseRequest;
import pucar.web.models.courtCase.CaseSearchRequest;
import pucar.web.models.courtCase.CourtCase;
import pucar.web.models.hearing.Hearing;
import pucar.web.models.hearing.HearingCriteria;
import pucar.web.models.hearing.HearingRequest;
import pucar.web.models.hearing.HearingSearchRequest;

import java.util.Collections;
import java.util.List;

import static pucar.config.ServiceConstants.*;

@Component
@Slf4j
public class PublishOrderDismissCase implements OrderUpdateStrategy {

    private final CaseUtil caseUtil;
    private final HearingUtil hearingUtil;
    private final Configuration config;

    @Autowired
    public PublishOrderDismissCase(CaseUtil caseUtil, HearingUtil hearingUtil, Configuration config) {
        this.caseUtil = caseUtil;
        this.hearingUtil = hearingUtil;
        this.config = config;
    }

    @Override
    public boolean supportsPreProcessing(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public boolean supportsPostProcessing(OrderRequest orderRequest) {
        Order order = orderRequest.getOrder();
        String action = order.getWorkflow().getAction();
        return order.getOrderType() != null && E_SIGN.equalsIgnoreCase(action) && DISMISS_CASE.equalsIgnoreCase(order.getOrderType());
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

        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction(REJECT);
        courtCase.setWorkflow(workflow);
        log.info("Dismissed the case with filing number:{},action:{}", courtCase.getFilingNumber(), workflow.getAction());
        caseUtil.updateCase(CaseRequest.builder().cases(courtCase).requestInfo(requestInfo).build());

        List<Hearing> hearings = hearingUtil.fetchHearing(HearingSearchRequest.builder()
                .criteria(HearingCriteria.builder().tenantId(order.getTenantId())
                        .filingNumber(order.getFilingNumber()).build()).requestInfo(requestInfo).build());

        StringBuilder hearingUpdateUri = new StringBuilder(config.getHearingHost()).append(config.getHearingUpdateEndPoint());

        log.info("Abandoning the hearings");
        hearings.stream()
                .filter(list -> list.getHearingType().equalsIgnoreCase(ADMISSION) && !(list.getStatus().equalsIgnoreCase(COMPLETED) || list.getStatus().equalsIgnoreCase(ABATED)))
                .findFirst().ifPresent(hearing -> {
                    WorkflowObject workflowObject = new WorkflowObject();
                    workflowObject.setAction(ABANDON);
                    hearing.setWorkflow(workflowObject);

                    log.info("hearingId:{}", hearing.getHearingId());

                    HearingRequest request = HearingRequest.builder()
                            .requestInfo(requestInfo).hearing(hearing).build();

                    hearingUtil.createOrUpdateHearing(request, hearingUpdateUri);
                });
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
