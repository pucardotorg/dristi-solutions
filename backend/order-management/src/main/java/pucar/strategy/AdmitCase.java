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
import pucar.web.models.courtCase.*;
import pucar.web.models.hearing.Hearing;
import pucar.web.models.hearing.HearingCriteria;
import pucar.web.models.hearing.HearingRequest;
import pucar.web.models.hearing.HearingSearchRequest;
import pucar.web.models.pendingtask.PendingTask;
import pucar.web.models.pendingtask.PendingTaskRequest;

import java.util.Collections;
import java.util.List;

import static pucar.config.ServiceConstants.*;

@Component
public class AdmitCase implements OrderUpdateStrategy {

    private final CaseUtil caseUtil;
    private final HearingUtil hearingUtil;
    private final Configuration config;
    private final PendingTaskUtil pendingTaskUtil;

    @Autowired
    public AdmitCase(CaseUtil caseUtil, HearingUtil hearingUtil, Configuration config, PendingTaskUtil pendingTaskUtil) {
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
        return false;
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

        List<CourtCase> cases = caseUtil.getCaseDetailsForSingleTonCriteria(CaseSearchRequest.builder()
                .criteria(Collections.singletonList(CaseCriteria.builder().filingNumber(order.getFilingNumber()).build()))
                .requestInfo(requestInfo).build());

        // add validation here
        CourtCase courtCase = cases.get(0);

        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction(ADMIT);
        courtCase.setWorkflow(workflow);

        caseUtil.updateCase(CaseRequest.builder().cases(courtCase).requestInfo(requestInfo).build());

        List<Hearing> hearings = hearingUtil.fetchHearing(HearingSearchRequest.builder()
                .criteria(HearingCriteria.builder().tenantId(order.getTenantId())
                        .filingNumber(order.getFilingNumber()).build()).requestInfo(requestInfo).build());

        StringBuilder hearingUpdateUri = new StringBuilder(config.getHearingHost()).append(config.getHearingUpdateEndPoint());


        hearings.stream()
                .filter(list -> list.getHearingType().equalsIgnoreCase(ADMISSION) && !(list.getStatus().equalsIgnoreCase(COMPLETED) || list.getStatus().equalsIgnoreCase(ABATED)))
                .findFirst().ifPresent(hearing -> {
                    WorkflowObject workflowObject = new WorkflowObject();
                    workflowObject.setAction(ABANDON);
                    hearing.setWorkflow(workflowObject);

                    HearingRequest request = HearingRequest.builder()
                            .requestInfo(requestInfo).hearing(hearing).build();

                    hearingUtil.createOrUpdateHearing(request, hearingUpdateUri);
                });

        // create pending task

        // schedule hearing pending task

        PendingTask pendingTask = PendingTask.builder()
                .name(SCHEDULE_HEARING)
                .referenceId(MANUAL + courtCase.getFilingNumber())
                .entityType("case-default")
                .status("SCHEDULE_HEARING")
                .assignedRole(List.of("JUDGE_ROLE"))
                .cnrNumber(courtCase.getCnrNumber())
                .filingNumber(courtCase.getFilingNumber())
                .isCompleted(false)
                .stateSla(pendingTaskUtil.getStateSla("SCHEDULE_HEARING"))
                .screenType("home")
                .build();

        pendingTaskUtil.createPendingTask(PendingTaskRequest.builder().requestInfo(requestInfo
        ).pendingTask(pendingTask).build());

        // pending response pending task

        List<Party> respondent = caseUtil.getRespondentOrComplainant(courtCase, "respondent");


        for (Party party : respondent) {

            String referenceId = MANUAL + "PENDING_RESPONSE_" + courtCase.getFilingNumber() + "_" + party.getIndividualId();
            pendingTask = PendingTask.builder()
                    .name(PENDING_RESPONSE)
                    .referenceId(referenceId)
                    .entityType("case-default")
                    .status("PENDING_RESPONSE")
                    .assignedRole(List.of("CASE_RESPONDER"))
                    .cnrNumber(courtCase.getCnrNumber())
                    .filingNumber(courtCase.getFilingNumber())
                    .isCompleted(true)
                    .screenType("home")
                    .build();

            pendingTaskUtil.createPendingTask(PendingTaskRequest.builder().requestInfo(requestInfo
            ).pendingTask(pendingTask).build());
        }


        return null;
    }


}
