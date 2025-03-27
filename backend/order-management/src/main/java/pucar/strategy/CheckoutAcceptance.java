package pucar.strategy;


import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.config.Configuration;
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

import static pucar.config.ServiceConstants.BULK_RESCHEDULE;
import static pucar.config.ServiceConstants.CHECKOUT_ACCEPTANCE;


@Component
@Slf4j
public class CheckoutAcceptance implements OrderUpdateStrategy {

    private final HearingUtil hearingUtil;
    private final OrderUtil orderUtil;
    private final ApplicationUtil applicationUtil;
    private final Configuration config;

    @Autowired
    public CheckoutAcceptance(HearingUtil hearingUtil, OrderUtil orderUtil, ApplicationUtil applicationUtil, Configuration config) {
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
        return order.getOrderType() != null && CHECKOUT_ACCEPTANCE.equalsIgnoreCase(order.getOrderType());
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
        String hearingNumber = order.getHearingNumber();

        // hearing update

        if (hearingNumber == null) {
            String referenceId = orderUtil.getReferenceId(order);

            List<Application> applications = applicationUtil.searchApplications(ApplicationSearchRequest.builder()
                    .criteria(ApplicationCriteria.builder()
                            .applicationNumber(referenceId)
                            .tenantId(order.getTenantId())
                            .build()).requestInfo(requestInfo).build());

            hearingNumber = orderUtil.getHearingNumberFormApplicationAdditionalDetails(applications.get(0).getAdditionalDetails());
        }

        List<Hearing> hearings = hearingUtil.fetchHearing(HearingSearchRequest.builder().requestInfo(requestInfo)
                .criteria(HearingCriteria.builder().hearingId(hearingNumber).tenantId(order.getTenantId()).build()).build());
        Hearing hearing = hearings.get(0);

        Long time = hearingUtil.getCreateStartAndEndTime(order.getAdditionalDetails(), Arrays.asList("formdata", "newHearingDate"));
        if (time != null) {
            hearing.setStartTime(time);
            hearing.setEndTime(time);
        }
        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction(BULK_RESCHEDULE);
        workflow.setComments("Update Hearing");

        StringBuilder updateUri = new StringBuilder(config.getHearingHost()).append(config.getHearingUpdateEndPoint());

        hearingUtil.createOrUpdateHearing(HearingRequest.builder().hearing(hearing).requestInfo(requestInfo).build(), updateUri);
        return null;
    }


}
