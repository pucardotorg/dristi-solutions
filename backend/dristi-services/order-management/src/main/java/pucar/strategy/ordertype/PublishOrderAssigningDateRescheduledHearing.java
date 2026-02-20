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
import pucar.web.models.application.Application;
import pucar.web.models.application.ApplicationCriteria;
import pucar.web.models.application.ApplicationSearchRequest;
import pucar.web.models.hearing.Hearing;
import pucar.web.models.hearing.HearingCriteria;
import pucar.web.models.hearing.HearingRequest;
import pucar.web.models.hearing.HearingSearchRequest;

import java.util.Arrays;
import java.util.List;

import static pucar.config.ServiceConstants.*;

@Component
@Slf4j
public class PublishOrderAssigningDateRescheduledHearing implements OrderUpdateStrategy {

    private final HearingUtil hearingUtil;
    private final OrderUtil orderUtil;
    private final ApplicationUtil applicationUtil;
    private final Configuration config;

    @Autowired
    public PublishOrderAssigningDateRescheduledHearing(HearingUtil hearingUtil, OrderUtil orderUtil, ApplicationUtil applicationUtil, Configuration config) {
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
        return order.getOrderType() != null && E_SIGN.equalsIgnoreCase(action) && ASSIGNING_DATE_RESCHEDULED_HEARING.equalsIgnoreCase(order.getOrderType());
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

        RequestInfo requestInfo = orderRequest.getRequestInfo();
        Order order = orderRequest.getOrder();
        log.info("After order publish process,result = IN_PROGRESS, orderType :{}, orderNumber:{}", order.getOrderType(), order.getOrderNumber());
        String hearingNumber = order.getScheduledHearingNumber();

        // hearing update and application case search if required
        if (hearingNumber == null) {
            String referenceId = orderUtil.getReferenceId(order);

            List<Application> applications = applicationUtil.searchApplications(ApplicationSearchRequest.builder()
                    .criteria(ApplicationCriteria.builder()
                            .applicationNumber(referenceId)
                            .tenantId(order.getTenantId())
                            .build()).requestInfo(requestInfo).build());

            hearingNumber = orderUtil.getHearingNumberFormApplicationAdditionalDetails(applications.get(0).getAdditionalDetails());
        }
        log.info("hearingNumber:{}", hearingNumber);
        List<Hearing> hearings = hearingUtil.fetchHearing(HearingSearchRequest.builder().requestInfo(requestInfo)
                .criteria(HearingCriteria.builder().hearingId(order.getScheduledHearingNumber()).tenantId(order.getTenantId()).build()).build());
        Hearing hearing = hearings.get(0);

        order.setHearingNumber(hearing.getHearingId());
        order.setHearingType(hearing.getHearingType());

        Long time = hearingUtil.getCreateStartAndEndTime(order.getAdditionalDetails(), Arrays.asList("formdata", "newHearingDate"));
        if (time != null) {
            hearing.setStartTime(time);
            hearing.setEndTime(time);
        }
        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction(SET_DATE);
        workflow.setComments("Update Hearing");
        hearing.setWorkflow(workflow);

        StringBuilder updateUri = new StringBuilder(config.getHearingHost()).append(config.getHearingUpdateEndPoint());
        hearingUtil.createOrUpdateHearing(HearingRequest.builder().hearing(hearing).requestInfo(requestInfo).build(), updateUri);
        return null;
    }


}
