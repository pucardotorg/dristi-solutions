package pucar.strategy.ordertype;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.config.Configuration;
import pucar.strategy.OrderUpdateStrategy;
import pucar.util.ApplicationUtil;
import pucar.util.HearingUtil;
import pucar.util.OrderUtil;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.WorkflowObject;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.hearing.Hearing;
import pucar.web.models.hearing.HearingCriteria;
import pucar.web.models.hearing.HearingRequest;
import pucar.web.models.hearing.HearingSearchRequest;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import static pucar.config.ServiceConstants.*;

@Component
@Slf4j
public class PublishAcceptRescheduleRequest implements OrderUpdateStrategy {

    private final HearingUtil hearingUtil;
    private final OrderUtil orderUtil;
    private final ApplicationUtil applicationUtil;
    private final Configuration config;

    @Autowired
    public PublishAcceptRescheduleRequest(HearingUtil hearingUtil, OrderUtil orderUtil, ApplicationUtil applicationUtil, Configuration config) {
        this.hearingUtil = hearingUtil;
        this.orderUtil = orderUtil;
        this.applicationUtil = applicationUtil;
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
        return order.getOrderType() != null && E_SIGN.equalsIgnoreCase(action) && ACCEPT_RESCHEDULING_REQUEST.equalsIgnoreCase(order.getOrderType());
    }

    @Override
    public OrderRequest preProcess(OrderRequest orderRequest) {
        return null;
    }

    @Override
    public OrderRequest postProcess(OrderRequest orderRequest) {
        RequestInfo requestInfo = orderRequest.getRequestInfo();
        Order order = orderRequest.getOrder();

        ZoneId zone = ZoneId.of("Asia/Kolkata");

        LocalDate hearingDate = Instant.ofEpochMilli(order.getNextHearingDate())
                .atZone(zone)
                .toLocalDate();

        LocalDate today = LocalDate.now(zone);

        boolean isSameDate = hearingDate.equals(today);
        log.info("After order publish process,result = IN_PROGRESS, orderType :{}, orderNumber:{}", order.getOrderType(), order.getOrderNumber());

        List<Hearing> hearings = hearingUtil.fetchHearing(HearingSearchRequest.builder().requestInfo(requestInfo)
                .criteria(HearingCriteria.builder().filingNumber(order.getFilingNumber()).tenantId(order.getTenantId()).status(SCHEDULED).build()).build());
        Hearing hearing = hearings.get(0);
        hearing.setStartTime(order.getNextHearingDate());
        hearing.setEndTime(order.getNextHearingDate());

        if(isSameDate) {
            WorkflowObject workflow = new WorkflowObject();
            workflow.setAction(CLOSE);
            workflow.setComments("Update Hearing");
            hearing.setWorkflow(workflow);

            hearingUtil.updateHearingSummary(orderRequest, hearing);

            StringBuilder updateUri = new StringBuilder(config.getHearingHost()).append(config.getHearingUpdateEndPoint());
            hearingUtil.createOrUpdateHearing(HearingRequest.builder().hearing(hearing).requestInfo(requestInfo).build(), updateUri);
        }else {
            WorkflowObject workflow = new WorkflowObject();
            workflow.setAction(PASS_OVER);
            workflow.setComments("Update Hearing");
            hearing.setWorkflow(workflow);

            StringBuilder updateUri = new StringBuilder(config.getHearingHost()).append(config.getHearingUpdateEndPoint());
            hearingUtil.createOrUpdateHearing(HearingRequest.builder().hearing(hearing).requestInfo(requestInfo).build(), updateUri);
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
