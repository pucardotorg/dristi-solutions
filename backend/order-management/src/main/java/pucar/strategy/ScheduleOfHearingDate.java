package pucar.strategy;

import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.config.Configuration;
import pucar.util.CaseUtil;
import pucar.util.HearingUtil;
import pucar.util.PendingTaskUtil;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.WorkflowObject;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.courtCase.CaseCriteria;
import pucar.web.models.courtCase.CaseRequest;
import pucar.web.models.courtCase.CaseSearchRequest;
import pucar.web.models.courtCase.CourtCase;
import pucar.web.models.hearing.HearingRequest;
import pucar.web.models.hearing.HearingResponse;

import java.util.Collections;
import java.util.List;

import static pucar.config.ServiceConstants.*;

@Component
public class ScheduleOfHearingDate implements OrderUpdateStrategy {

    private final HearingUtil hearingUtil;
    private final Configuration configuration;
    private final CaseUtil caseUtil;
    private final PendingTaskUtil pendingTaskUtil;

    @Autowired
    public ScheduleOfHearingDate(HearingUtil hearingUtil, Configuration configuration, CaseUtil caseUtil, PendingTaskUtil pendingTaskUtil) {
        this.hearingUtil = hearingUtil;
        this.configuration = configuration;
        this.caseUtil = caseUtil;
        this.pendingTaskUtil = pendingTaskUtil;
    }

    @Override
    public boolean supportsPreProcessing(OrderRequest orderRequest) {
        Order order = orderRequest.getOrder();
        return order.getOrderType() != null && SCHEDULE_OF_HEARING_DATE.equalsIgnoreCase(order.getOrderType());
    }

    @Override
    public boolean supportsPostProcessing(OrderRequest orderRequest) {
        Order order = orderRequest.getOrder();
        return order.getOrderType() != null && SCHEDULE_OF_HEARING_DATE.equalsIgnoreCase(order.getOrderType());
    }

    @Override
    public OrderRequest preProcess(OrderRequest orderRequest) {

        Order order = orderRequest.getOrder();
        RequestInfo requestInfo = orderRequest.getRequestInfo();

        // Create hearing
        List<CourtCase> cases = caseUtil.getCaseDetailsForSingleTonCriteria(CaseSearchRequest.builder()
                .criteria(Collections.singletonList(CaseCriteria.builder().filingNumber(order.getFilingNumber()).tenantId(order.getTenantId()).defaultFields(false).build()))
                .requestInfo(requestInfo).build());

        // add validation here
        CourtCase courtCase = cases.get(0);

        HearingRequest request = hearingUtil.createHearingRequestForScheduleNextHearingAndScheduleOfHearingDate(requestInfo, order, courtCase);
        StringBuilder createHearingUri = new StringBuilder(configuration.getHearingHost()).append(configuration.getHearingCreateEndPoint());
        HearingResponse createdHearingResponse = hearingUtil.createOrUpdateHearing(request, createHearingUri);
        order.setHearingNumber(createdHearingResponse.getHearing().getHearingId());
        return null;
    }

    @Override
    public OrderRequest postProcess(OrderRequest orderRequest) {

        Order order = orderRequest.getOrder();
        RequestInfo requestInfo = orderRequest.getRequestInfo();

        // case update
        List<CourtCase> cases = caseUtil.getCaseDetailsForSingleTonCriteria(CaseSearchRequest.builder()
                .criteria(Collections.singletonList(CaseCriteria.builder().filingNumber(order.getFilingNumber()).build()))
                .requestInfo(requestInfo).build());

        // add validation here
        CourtCase courtCase = cases.get(0);
        String status = courtCase.getStatus();

        if (!CASE_ADMITTED.equalsIgnoreCase(status)) {

            WorkflowObject workflow = new WorkflowObject();
            workflow.setAction(SCHEDULE_ADMISSION_HEARING);
            courtCase.setWorkflow(workflow);
            CaseRequest request = CaseRequest.builder().requestInfo(requestInfo)
                    .cases(courtCase).build();
            caseUtil.updateCase(request);

        }

        // close manual pending task for filing number
        pendingTaskUtil.closeManualPendingTask(order.getHearingNumber(), requestInfo);


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
