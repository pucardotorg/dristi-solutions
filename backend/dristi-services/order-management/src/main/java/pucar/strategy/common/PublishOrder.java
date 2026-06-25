package pucar.strategy.common;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.config.Configuration;
import pucar.strategy.OrderUpdateStrategy;
import pucar.util.*;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.WorkflowObject;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.application.Application;
import pucar.web.models.application.ApplicationCriteria;
import pucar.web.models.application.ApplicationRequest;
import pucar.web.models.application.ApplicationSearchRequest;
import pucar.web.models.courtCase.CaseCriteria;
import pucar.web.models.courtCase.CaseSearchRequest;
import pucar.web.models.courtCase.CourtCase;
import pucar.web.models.hearing.Hearing;
import pucar.web.models.hearing.HearingCriteria;
import pucar.web.models.hearing.HearingSearchRequest;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static pucar.config.ServiceConstants.E_SIGN;
import static pucar.config.ServiceConstants.SCHEDULED;


@Component
@Slf4j
public class PublishOrder implements OrderUpdateStrategy {

    private final ApplicationUtil applicationUtil;
    private final PendingTaskUtil pendingTaskUtil;
    private final OrderUtil orderUtil;
    private final CaseUtil caseUtil;
    private final HearingUtil hearingUtil;
    private final DateUtil dateUtil;
    private final Configuration configuration;

    @Autowired
    public PublishOrder(ApplicationUtil applicationUtil, PendingTaskUtil pendingTaskUtil, OrderUtil orderUtil, CaseUtil caseUtil, HearingUtil hearingUtil, DateUtil dateUtil, Configuration configuration) {
        this.applicationUtil = applicationUtil;
        this.pendingTaskUtil = pendingTaskUtil;
        this.orderUtil = orderUtil;
        this.caseUtil = caseUtil;
        this.hearingUtil = hearingUtil;
        this.dateUtil = dateUtil;
        this.configuration = configuration;
    }

    @Override
    public boolean supportsPreProcessing(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public boolean supportsPostProcessing(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public OrderRequest preProcess(OrderRequest orderRequest) {
        return null;
    }

    @Override
    public OrderRequest postProcess(OrderRequest orderRequest) {
        return null;
    }

    @Override
    public boolean supportsCommon(OrderRequest orderRequest) {
        Order order = orderRequest.getOrder();
        String action = order.getWorkflow().getAction();
        return E_SIGN.equalsIgnoreCase(action);
    }

    @Override
    public CaseDiaryEntry execute(OrderRequest orderRequest) {


        Order order = orderRequest.getOrder();
        RequestInfo requestInfo = orderRequest.getRequestInfo();
        log.info("Executing common,orderNumber:{}, orderType:{}", order.getOrderNumber(), order.getOrderType());

        List<CourtCase> cases = caseUtil.getCaseDetailsForSingleTonCriteria(CaseSearchRequest.builder()
                .criteria(Collections.singletonList(CaseCriteria.builder().filingNumber(order.getFilingNumber()).tenantId(order.getTenantId()).defaultFields(false).build()))
                .requestInfo(requestInfo).build());

        // add validation here
        CourtCase courtCase = cases.get(0);
        // fetch case for cmp number
        // if order have referenceId then update application
        String referenceId = orderUtil.getReferenceId(order);
        log.info("referenceId:{}", referenceId);
        if (referenceId != null) {
            List<Application> applications = applicationUtil.searchApplications(ApplicationSearchRequest.builder()
                    .criteria(ApplicationCriteria.builder()
                            .applicationNumber(referenceId)
                            .tenantId(order.getTenantId())
                            .build()).requestInfo(requestInfo).build());

            Application application = applications.get(0);
            application.setCmpNumber(courtCase.getCmpNumber());
            WorkflowObject workflow = new WorkflowObject();
            workflow.setAction(orderUtil.getActionForApplication(order.getAdditionalDetails()));
            application.setWorkflow(workflow);
            log.info("updating application with applicationId:{} and action :{}", application.getApplicationNumber(), workflow.getAction());
            applicationUtil.updateApplication(ApplicationRequest.builder().requestInfo(requestInfo)
                    .application(application).build());


        }

        //close pending task
        log.info("closing pending task for order number:{}", order.getOrderNumber());
        pendingTaskUtil.closeManualPendingTask(order.getOrderNumber(), requestInfo, courtCase.getFilingNumber(), courtCase.getCnrNumber(), courtCase.getId().toString(), courtCase.getCaseTitle());

        List<Hearing> hearings = hearingUtil.fetchHearing(HearingSearchRequest.builder()
                .criteria(HearingCriteria.builder().tenantId(order.getTenantId())
                        .filingNumber(order.getFilingNumber()).build())
                .requestInfo(requestInfo).build());


        log.info("finding scheduled hearing for order number:{}", order.getOrderNumber());
        Optional<Hearing> scheduledHearing = hearings.stream().filter((hearing) -> SCHEDULED.equalsIgnoreCase(hearing.getStatus())).findFirst();

        Long hearingDate = null;
        if (scheduledHearing.isPresent()) {
            hearingDate = scheduledHearing.get().getStartTime();
        }
        log.info("creating case diary entry for order number:{}", order.getOrderNumber());
        return CaseDiaryEntry.builder()
                .tenantId(order.getTenantId())
                .entryDate(dateUtil.getStartOfTheDayForEpoch(dateUtil.getCurrentTimeInMilis()))
                .caseNumber(courtCase.getCourtCaseNumber() != null? courtCase.getCourtCaseNumber() : courtCase.getCmpNumber())
                .caseId(courtCase.getId().toString())
                .courtId(courtCase.getCourtId())
                .businessOfDay(orderUtil.getBusinessOfTheDay(order,requestInfo))
                .referenceId(order.getOrderNumber())
                .referenceType("Order")
                .hearingDate(hearingDate)
                .additionalDetails(Map.of("filingNumber", order.getFilingNumber())) //this shit need to be removed
                .build();


    }
}
