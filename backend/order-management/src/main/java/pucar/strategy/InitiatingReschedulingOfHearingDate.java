package pucar.strategy;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.springframework.beans.factory.annotation.Autowired;
import pucar.config.Configuration;
import pucar.config.StateSlaMap;
import pucar.util.*;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.WorkflowObject;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.application.Application;
import pucar.web.models.application.ApplicationCriteria;
import pucar.web.models.application.ApplicationSearchRequest;
import pucar.web.models.courtCase.CaseCriteria;
import pucar.web.models.courtCase.CaseSearchRequest;
import pucar.web.models.courtCase.CourtCase;
import pucar.web.models.hearing.Hearing;
import pucar.web.models.hearing.HearingCriteria;
import pucar.web.models.hearing.HearingRequest;
import pucar.web.models.hearing.HearingSearchRequest;
import pucar.web.models.pendingtask.PendingTask;
import pucar.web.models.scheduler.ReScheduleHearing;
import pucar.web.models.scheduler.ReScheduleHearingRequest;

import java.util.*;

import static pucar.config.ServiceConstants.*;

public class InitiatingReschedulingOfHearingDate implements OrderUpdateStrategy {


    private final ApplicationUtil applicationUtil;
    private final OrderUtil orderUtil;
    private final JsonUtil jsonUtil;
    private final HearingUtil hearingUtil;
    private final Configuration config;
    private final DateUtil dateUtil;
    private final SchedulerUtil schedulerUtil;
    private final PendingTaskUtil pendingTaskUtil;
    private final CaseUtil caseUtil;
    private final AdvocateUtil advocateUtil;

    @Autowired
    public InitiatingReschedulingOfHearingDate(ApplicationUtil applicationUtil, OrderUtil orderUtil, JsonUtil jsonUtil, HearingUtil hearingUtil, Configuration config, DateUtil dateUtil, SchedulerUtil schedulerUtil, PendingTaskUtil pendingTaskUtil, CaseUtil caseUtil, AdvocateUtil advocateUtil) {
        this.applicationUtil = applicationUtil;
        this.orderUtil = orderUtil;
        this.jsonUtil = jsonUtil;
        this.hearingUtil = hearingUtil;
        this.config = config;
        this.dateUtil = dateUtil;
        this.schedulerUtil = schedulerUtil;
        this.pendingTaskUtil = pendingTaskUtil;
        this.caseUtil = caseUtil;
        this.advocateUtil = advocateUtil;
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

        RequestInfo requestInfo = orderRequest.getRequestInfo();
        Order order = orderRequest.getOrder();

        String referenceId = orderUtil.getReferenceId(order);
        String hearingNumber = order.getHearingNumber();

        String changedHearingDate = null;

        // search hearing and update hearing
        if (referenceId != null) {
            List<Application> applications = applicationUtil.searchApplications(ApplicationSearchRequest.builder()
                    .criteria(ApplicationCriteria.builder()
                            .applicationNumber(referenceId)
                            .tenantId(order.getTenantId())
                            .build()).requestInfo(requestInfo).build());

            changedHearingDate = jsonUtil.getNestedValue(applications.get(0).getAdditionalDetails(), Arrays.asList("formdata", "changedHearingDate"), String.class);
            hearingNumber = jsonUtil.getNestedValue(applications.get(0).getAdditionalDetails(), List.of("hearingId"), String.class);

        }

        String originalHearingDate = jsonUtil.getNestedValue(order.getAdditionalDetails(), Arrays.asList("formdata", "originalHearingDate"), String.class);


        List<Hearing> hearings = hearingUtil.fetchHearing(HearingSearchRequest.builder().requestInfo(requestInfo)
                .criteria(HearingCriteria.builder().hearingId(hearingNumber).tenantId(order.getTenantId()).build()).build());
        Hearing hearing = hearings.get(0);

        hearing.setStartTime(hearingUtil.getCreateStartAndEndTime(order.getAdditionalDetails()));
        hearing.setEndTime(hearingUtil.getCreateStartAndEndTime(order.getAdditionalDetails()));
        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction(RESCHEDULE);
        workflow.setComments("Update Hearing");

        StringBuilder updateUri = new StringBuilder(config.getHearingHost()).append(config.getHearingUpdateEndPoint());

        hearingUtil.createOrUpdateHearing(HearingRequest.builder().hearing(hearing).requestInfo(requestInfo).build(), updateUri);


        // create reschedule request
        String availableAfter = Optional.ofNullable(changedHearingDate)
                .orElse(originalHearingDate);

        Long scheduleAfter = availableAfter == null ? dateUtil.getCurrentTimeInMilis() : dateUtil.getEpochFromDateString(availableAfter, "yyyy-MM-dd");

        schedulerUtil.createRescheduleRequest(ReScheduleHearingRequest.builder()
                .reScheduleHearing(Collections.singletonList(ReScheduleHearing.builder()

                        .rescheduledRequestId(order.getOrderNumber())
                        .hearingBookingId(order.getHearingNumber())
                        .tenantId(order.getTenantId())
                        .judgeId("JUDGE_ID")  ///  this need to come from order
                        .caseId(order.getFilingNumber())
                        .reason(order.getComments())
                        .availableAfter(scheduleAfter)
                        .build()))
                .requestInfo(requestInfo).build());

        // call case here

        List<CourtCase> cases = caseUtil.getCaseDetailsForSingleTonCriteria(CaseSearchRequest.builder()
                .criteria(Collections.singletonList(CaseCriteria.builder().filingNumber(order.getFilingNumber()).build()))
                .requestInfo(requestInfo).build());

        // add validation here
        CourtCase courtCase = cases.get(0);

        Map<String, List<String>> litigantAdvocateMapping = advocateUtil.getLitigantAdvocateMapping(courtCase);

        List<String> uniqueAssignees = pendingTaskUtil.getUniqueAssignees(litigantAdvocateMapping);

        for (String assigneeUUID : uniqueAssignees) {


            // create pending task
            PendingTask pendingTask = PendingTask.builder()
                    .name(CHOOSE_DATES_FOR_RESCHEDULE_OF_HEARING_DATE)
                    .referenceId("ref-123")
                    .entityType("hearing-default")
                    .status("OPTOUT")
                    .assignedTo(List.of(User.builder().uuid(assigneeUUID).build()))
                    .cnrNumber(courtCase.getCnrNumber())
                    .filingNumber(courtCase.getFilingNumber())
                    .isCompleted(false)
                    .stateSla()
                    .additionalDetails(pendingTaskUtil.getAdditionalDetails(courtCase, assigneeUUID))
                    .screenType("home")
                    .build();
        }


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
