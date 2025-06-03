package pucar.strategy.hearing;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.config.Configuration;
import pucar.strategy.HearingUpdateStrategy;
import pucar.util.CaseUtil;
import pucar.util.HearingUtil;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.WorkflowObject;
import pucar.web.models.courtCase.CaseCriteria;
import pucar.web.models.courtCase.CaseSearchRequest;
import pucar.web.models.courtCase.CourtCase;
import pucar.web.models.hearing.Hearing;
import pucar.web.models.hearing.HearingRequest;

import java.util.Collections;
import java.util.List;

import static pucar.config.ServiceConstants.*;

@Component
@Slf4j
public class HearingUpdateWithWorkflow implements HearingUpdateStrategy {

    private final HearingUtil hearingUtil;

    private final CaseUtil caseUtil;

    private final Configuration configuration;

    @Autowired
    public HearingUpdateWithWorkflow(HearingUtil hearingUtil, CaseUtil caseUtil, Configuration configuration) {
        this.hearingUtil = hearingUtil;
        this.caseUtil = caseUtil;
        this.configuration = configuration;
    }

    @Override
    public boolean updateHearingBasedOnStatus(String status, boolean isSaveDraftAction) {
        return ((IN_PROGRESS.equalsIgnoreCase(status) || PASSED_OVER.equalsIgnoreCase(status) || ABANDONED.equalsIgnoreCase(status)) && (!isSaveDraftAction));
    }

    @Override
    public void updateHearingBasedOnStatus(Hearing hearing, OrderRequest orderRequest) {

        log.info("updateHearingBasedOnStatus with workflow : {}", hearing);

        RequestInfo requestInfo = orderRequest.getRequestInfo();
        Order order = orderRequest.getOrder();

        List<CourtCase> cases = caseUtil.getCaseDetailsForSingleTonCriteria(CaseSearchRequest.builder()
                .criteria(Collections.singletonList(CaseCriteria.builder().filingNumber(order.getFilingNumber()).tenantId(order.getTenantId()).defaultFields(false).build()))
                .requestInfo(requestInfo).build());

        WorkflowObject workflowObject = new WorkflowObject();
        workflowObject.setAction(CLOSE);
        hearing.setWorkflow(workflowObject);
        hearing.setHearingSummary(hearingUtil.getHearingSummary(order));
        hearing.setAttendees(hearingUtil.getAttendees(orderRequest.getRequestInfo(), cases.get(0), order, false));

        StringBuilder updateUri = new StringBuilder();
        updateUri.append(configuration.getHearingHost()).append(configuration.getHearingUpdateEndPoint());

        hearingUtil.createOrUpdateHearing(HearingRequest.builder().hearing(hearing).requestInfo(orderRequest.getRequestInfo()).build(), updateUri);

        log.info("updateHearingBasedOnStatus with workflow status SUCCESS : {}", hearing);
    }
}
