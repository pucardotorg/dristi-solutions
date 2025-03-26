package pucar.strategy;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.util.ApplicationUtil;
import pucar.util.CaseUtil;
import pucar.util.JsonUtil;
import pucar.util.PendingTaskUtil;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.application.Application;
import pucar.web.models.application.ApplicationCriteria;
import pucar.web.models.application.ApplicationSearchRequest;
import pucar.web.models.courtCase.CaseCriteria;
import pucar.web.models.courtCase.CaseSearchRequest;
import pucar.web.models.courtCase.CourtCase;
import pucar.web.models.courtCase.Party;
import pucar.web.models.pendingtask.PendingTask;
import pucar.web.models.pendingtask.PendingTaskRequest;

import java.util.*;

import static pucar.config.ServiceConstants.*;

@Component
public class SetBailTerms implements OrderUpdateStrategy {

    private final CaseUtil caseUtil;
    private final ApplicationUtil applicationUtil;
    private final JsonUtil jsonUtil;
    private final PendingTaskUtil pendingTaskUtil;

    @Autowired
    public SetBailTerms(CaseUtil caseUtil, ApplicationUtil applicationUtil, JsonUtil jsonUtil, PendingTaskUtil pendingTaskUtil) {
        this.caseUtil = caseUtil;
        this.applicationUtil = applicationUtil;
        this.jsonUtil = jsonUtil;
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
    public OrderRequest preProcess(OrderRequest orderRequest) {
        return null;
    }

    @Override
    public OrderRequest postProcess(OrderRequest orderRequest) {

        Order order = orderRequest.getOrder();
        RequestInfo requestInfo = orderRequest.getRequestInfo();

        // fetch case

        List<CourtCase> cases = caseUtil.getCaseDetailsForSingleTonCriteria(CaseSearchRequest.builder()
                .criteria(Collections.singletonList(CaseCriteria.builder().filingNumber(order.getFilingNumber()).build()))
                .requestInfo(requestInfo).build());

        // add validation here
        CourtCase courtCase = cases.get(0);

        // fetch application

        String referenceId = jsonUtil.getNestedValue(order.getAdditionalDetails(), Arrays.asList("formdata", "refApplicationId"), String.class);
        String assigneeUUID = jsonUtil.getNestedValue(order.getAdditionalDetails(), Arrays.asList("formdata", "partyId"), String.class);
        List<Application> applications = applicationUtil.searchApplications(ApplicationSearchRequest.builder()
                .criteria(ApplicationCriteria.builder()
                        .applicationNumber(referenceId)
                        .tenantId(order.getTenantId())
                        .build()).requestInfo(requestInfo).build());
        Application application = applications.get(0);

        Object additionalDetails = getAdditionalDetails(courtCase,application);

        // create pending task

        String itemId = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("itemId"), String.class);
        itemId = itemId != null ? itemId + "_" : "";

        String pendingTaskReferenceId = MANUAL + itemId + assigneeUUID + "_" + order.getOrderNumber();


        // create pending task
        PendingTask pendingTask = PendingTask.builder()
                .name(SUBMIT_BAIL_DOCUMENTS)
                .referenceId(pendingTaskReferenceId)
                .entityType("voluntary-application-submission-bail-documents")
                .status("CREATE_SUBMISSION")
                .assignedTo(List.of(User.builder().uuid(assigneeUUID).build()))
                .cnrNumber(courtCase.getCnrNumber())
                .filingNumber(courtCase.getFilingNumber())
                .isCompleted(false)
                .stateSla(pendingTaskUtil.getStateSla("SUBMIT_BAIL_DOCUMENTS"))
                .additionalDetails(additionalDetails)
                .screenType("home")
                .build();

        pendingTaskUtil.createPendingTask(PendingTaskRequest.builder().requestInfo(requestInfo
        ).pendingTask(pendingTask).build());


        return null;
    }

    private Object getAdditionalDetails(CourtCase courtCase, Application application) {
        Map<String, Object> additionalDetails = new HashMap<>();

        additionalDetails.put("litigants", Arrays.asList(
                courtCase.getLitigants().stream()
                        .filter(litigant -> jsonUtil.getNestedValue(litigant.getAdditionalDetails(), Arrays.asList("uuid"),String.class).equals(jsonUtil.getNestedValue(application.getAdditionalDetails(), Arrays.asList("formdata", "selectComplainant", "uuid"),String.class)))
                        .map(Party::getIndividualId)
                        .findFirst()
                        .orElse(null)

        ));
        additionalDetails.put("litigantUuid", Arrays.asList(
                courtCase.getLitigants().stream()
                        .filter(litigant -> jsonUtil.getNestedValue(litigant.getAdditionalDetails(), Arrays.asList("uuid"), String.class).equals(jsonUtil.getNestedValue(application.getAdditionalDetails(), Arrays.asList("formdata", "selectComplainant", "uuid"), String.class)))
                        .map(litigant -> jsonUtil.getNestedValue(litigant.getAdditionalDetails(), Arrays.asList("uuid"), String.class))
                        .findFirst()
                        .orElse(null)
        ));

        return additionalDetails;
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
