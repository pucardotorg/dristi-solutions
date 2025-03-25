package pucar.strategy;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.util.TaskUtil;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.WorkflowObject;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.courtCase.CourtCase;
import pucar.web.models.courtCase.Party;
import pucar.web.models.task.Amount;
import pucar.web.models.task.Task;
import pucar.web.models.task.TaskRequest;

import java.util.*;

@Component
public class Warrant implements OrderUpdateStrategy {

    private final TaskUtil taskUtil;
    private final ObjectMapper objectMapper;

    @Autowired
    public Warrant(TaskUtil taskUtil, ObjectMapper objectMapper) {
        this.taskUtil = taskUtil;
        this.objectMapper = objectMapper;
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

        TaskRequest taskRequest = TaskRequest.builder().build();
        Task task = Task.builder()
                .tenantId(order.getTenantId())
                .orderId(order.getId())
                .filingNumber(order.getFilingNumber())
                .cnrNumber(order.getCnrNumber())
                .createdDate(System.currentTimeMillis())  // this is ist
                .taskType(order.getOrderType())
                .taskDetails(getTaskDetails())
                .amount(Amount.builder().type("FINE").status("DONE")
                        .amount("getting from mdms").build())
                .status("IN_PROGRESS")
                .isActive(true)
                .additionalDetails(getAdditionDetails())
                .workflow(getWorkflow())
                .build();


        return null;
    }

    @Override
    public boolean supportsCommon() {
        return false;
    }

    @Override
    public CaseDiaryEntry execute(OrderRequest request) {
        return null;
    }

    private WorkflowObject getWorkflow() {

        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction("CREATE");
        workflow.setComments("Order Type");
        return workflow;

    }

    private Object getAdditionDetails() {
        return null;

    }


    public Object createTask(String orderType, CourtCase caseDetails, Order orderData) throws JsonProcessingException {
        Map<String, Object> payload = new HashMap<>();
        List<Party> litigants = caseDetails.getLitigants();

        Optional<String> complainantIndividualId = litigants.stream()
                .filter(item -> "complainant.primary".equals(item.getPartyType()))
                .map(Party::getIndividualId)
                .findFirst();


        ///  individual service call
        CompletableFuture<IndividualDetail> individualDetailFuture =
                Digit.DRISTIService.searchIndividualUser(new IndividualRequest(complainantIndividualId.orElse(null)));

        JsonNode orderFormData = getFormData(orderType, orderData);
        Object additionalDetailsObj = orderData.getAdditionalDetails();
        JsonNode additionalDetails = objectMapper.readTree(additionalDetailsObj.toString());

        JsonNode respondentNameData = getOrderData(orderType, orderFormData);

        List<String> selectedChannels = additionalDetails.has(orderType.equals("NOTICE") ? "noticeOrder" : "SummonsOrder")
                ? additionalDetails.get(orderType.equals("NOTICE") ? "noticeOrder" : "SummonsOrder").get("selectedChannels").findValuesAsText("name")
                : Collections.emptyList();

        JsonNode respondentAddress = orderFormData.has("addressDetails") ? orderFormData.get("addressDetails")
                : respondentNameData.has("address") ? respondentNameData.get("address")
                : objectMapper.readTree(caseDetails.getAdditionalDetails().toString()).get("respondentDetails").get("formdata").get(0).get("data").get("addressDetails");

        Respondent respondentDetails = new Respondent(getRespondentName(respondentNameData), respondentAddress.get(0));

        switch (orderType) {
            case "SUMMONS":
                payload.put("summonDetails", new SummonDetails(orderData.getAuditDetails().getLastModifiedTime(), caseDetails.getFilingDate()));
                payload.put("respondentDetails", respondentDetails);
                payload.put("caseDetails", new CaseDetail(caseDetails.getCaseTitle(), caseDetails.getFilingDate()));
                break;

            case "NOTICE":
                payload.put("noticeDetails", new NoticeDetails(orderData.getAuditDetails().getLastModifiedTime(), caseDetails.getFilingDate()));
                payload.put("respondentDetails", respondentDetails);
                payload.put("caseDetails", new CaseDetail(caseDetails.getCaseTitle(), caseDetails.getFilingDate()));
                break;

            case "WARRANT":
                payload.put("warrantDetails", new WarrantDetails(orderData.getAuditDetails().getLastModifiedTime(), caseDetails.getFilingDate()));
                payload.put("respondentDetails", respondentDetails);
                payload.put("caseDetails", new CaseDetail(caseDetails.getCaseTitle(), caseDetails.getFilingDate()));
                break;
        }

        return payload;
    }

    private JsonNode getFormData(String orderType, Order order)  {
        Map<String, String> formDataKeyMap = Map.of(
                "SUMMONS", "SummonsOrder",
                "WARRANT", "warrantFor",
                "NOTICE", "noticeOrder"
        );
        String formDataKey = formDataKeyMap.get(orderType);
        try {
            JsonNode additionalDetails = objectMapper.readTree(order.getAdditionalDetails().toString());
            JsonNode formdata = additionalDetails.get("formdata");
            return formdata.get(formDataKey);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

    }

    private JsonNode getOrderData(String orderType, JsonNode orderFormData) {
        if (Arrays.asList("SUMMONS", "NOTICE").contains(orderType) && orderFormData.has("party")) {
            return orderFormData.get("party").get("data");
        }
        return orderFormData;
    }

}




