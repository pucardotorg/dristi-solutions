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
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.courtCase.CaseCriteria;
import pucar.web.models.courtCase.CaseSearchRequest;
import pucar.web.models.courtCase.CourtCase;
import pucar.web.models.hearing.HearingRequest;
import pucar.web.models.hearing.HearingResponse;

import java.util.Collections;
import java.util.List;

import static pucar.config.ServiceConstants.E_SIGN;
import static pucar.config.ServiceConstants.SCHEDULING_NEXT_HEARING;

@Component
@Slf4j
public class PublishOrderSchedulingNextHearing implements OrderUpdateStrategy {

    private final HearingUtil hearingUtil;
    private final Configuration configuration;
    private final CaseUtil caseUtil;

    @Autowired
    public PublishOrderSchedulingNextHearing(HearingUtil hearingUtil, Configuration configuration, CaseUtil caseUtil) {
        this.hearingUtil = hearingUtil;
        this.configuration = configuration;
        this.caseUtil = caseUtil;
    }

    @Override
    public boolean supportsPreProcessing(OrderRequest orderRequest) {
        Order order = orderRequest.getOrder();
        String action = order.getWorkflow().getAction();
        return order.getOrderType() != null && E_SIGN.equalsIgnoreCase(action) && SCHEDULING_NEXT_HEARING.equalsIgnoreCase(order.getOrderType());
    }

    @Override
    public boolean supportsPostProcessing(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public OrderRequest preProcess(OrderRequest orderRequest) {

        Order order = orderRequest.getOrder();
        RequestInfo requestInfo = orderRequest.getRequestInfo();
        log.info("pre processing, result=IN_PROGRESS,orderNumber:{}, orderType:{}", order.getOrderNumber(), SCHEDULING_NEXT_HEARING);

        List<CourtCase> cases = caseUtil.getCaseDetailsForSingleTonCriteria(CaseSearchRequest.builder()
                .criteria(Collections.singletonList(CaseCriteria.builder().filingNumber(order.getFilingNumber()).tenantId(order.getTenantId()).defaultFields(false).build()))
                .requestInfo(requestInfo).build());

        // add validation here
        CourtCase courtCase = cases.get(0);

        HearingRequest request = hearingUtil.createHearingRequestForScheduleNextHearingAndScheduleOfHearingDate(requestInfo, order, courtCase);

        StringBuilder createHearingURI = new StringBuilder(configuration.getHearingHost()).append(configuration.getHearingCreateEndPoint());

        HearingResponse newHearing = hearingUtil.createOrUpdateHearing(request, createHearingURI);

        order.setHearingNumber(newHearing.getHearing().getHearingId());
        log.info("hearing number:{}", newHearing.getHearing().getHearingId());

        log.info("pre processing, result=SUCCESS,orderNumber:{}, orderType:{}", order.getOrderNumber(), SCHEDULING_NEXT_HEARING);

        return null;
    }

    @Override
    public OrderRequest postProcess(OrderRequest orderRequest) {
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
