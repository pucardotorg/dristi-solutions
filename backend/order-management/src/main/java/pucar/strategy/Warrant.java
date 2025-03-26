package pucar.strategy;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import jakarta.validation.Valid;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.models.individual.Individual;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.service.IndividualService;
import pucar.util.TaskUtil;
import pucar.web.models.*;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.courtCase.CourtCase;
import pucar.web.models.courtCase.Party;
import pucar.web.models.task.*;

import java.time.Instant;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Component
public class Warrant implements OrderUpdateStrategy {

    private final TaskUtil taskUtil;
    private final ObjectMapper objectMapper;
    private final IndividualService individualService;

    @Autowired
    public Warrant(TaskUtil taskUtil, ObjectMapper objectMapper, IndividualService individualService) {
        this.taskUtil = taskUtil;
        this.objectMapper = objectMapper;
        this.individualService = individualService;
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
//                .taskDetails(getTaskDetails())
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
    public boolean supportsCommon(OrderRequest orderRequest) {
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


    public TaskRequest createTask(CourtCase caseDetails, Order orderData) throws JsonProcessingException {
        Task task = Task.builder()
                .createdDate(System.currentTimeMillis())
                .orderId(orderData.getId())
                .filingNumber(caseDetails.getFilingNumber())
                .cnrNumber(caseDetails.getCnrNumber())
                .taskType(orderData.getOrderType())
                .status("IN_PROGRESS")
                .tenantId(caseDetails.getTenantId())
                .workflow((WorkflowObject) WorkflowObject.builder().action("CREATE").comments(orderData.getOrderType()).build())
                .amount(Amount.builder().type("FINE").status("DONE").build())
                .build();
        return TaskRequest.builder().task(task).build();
    }

    private String getFormData(String orderType) {
        Map<String, String> formDataKeyMap = Map.of(
                "SUMMONS", "SummonsOrder",
                "WARRANT", "warrantFor",
                "NOTICE", "noticeOrder"
        );
        return formDataKeyMap.get(orderType);
    }

    private JsonNode getOrderData(String orderType, JsonNode orderFormData) {
        if (Arrays.asList("SUMMONS", "NOTICE").contains(orderType) && orderFormData.has("party")) {
            return orderFormData.get("party").get("data");
        }
        return orderFormData;
    }

    private WarrantDetails buildWarrantDetails(Order orderData, CourtCase courtCase) {
        JsonNode additionalDetails = objectMapper.convertValue(orderData.getAdditionalDetails(), JsonNode.class);
        JsonNode orderFormValue = additionalDetails.get("formdata");
        return WarrantDetails.builder()
                .issueDate(orderData.getAuditDetails().getLastModifiedTime())
                .caseFilingDate(courtCase.getFilingDate())
                .docType(orderFormValue.get("warrantType").get("code").asText())
                .docSubType(orderFormValue.get("bailInfo").get("isBailable").get("code").asBoolean() ? "BAILABLE" : "NON_BAILABLE")
                .surety(orderFormValue.get("bailInfo").get("noOfSureties").get("code").asText())
                .bailableAmount(orderFormValue.get("bailInfo").get("bailableAmount").asDouble())
                .build();
    }

    private CaseDetails buildCaseDetails(CourtCase courtCase, Order orderData, CourtDetails courtDetails) {
        return CaseDetails.builder()
                .caseTitle(courtCase.getCaseTitle())
                .caseYear(String.valueOf(Instant.ofEpochMilli(courtCase.getRegistrationDate())
                        .atZone(ZoneId.systemDefault())
                        .toLocalDate()
                        .getYear()))
                .hearingDate(JsonPath.read(orderData.getAdditionalDetails(), "$.formdata.dateOfHearing"))
                .judgeName(courtCase.getJudgeId())
                .courtName(courtDetails.getCourtName())
                .courtAddress(courtDetails.getCourtAddress())
                .courtId(courtDetails.getCourtId())
                .phoneNumber(courtDetails.getPhoneNumber())
                .hearingNumber(orderData.getHearingNumber())
                .build();
    }

    private RespondentDetails buildRespondentDetails(CourtCase courtCase, Order order) {
        JsonNode orderAdditionalDetails = objectMapper.convertValue(order.getAdditionalDetails(), JsonNode.class);
        JsonNode caseAdditionalDetails = objectMapper.convertValue(order.getAdditionalDetails(), JsonNode.class);

        return RespondentDetails.builder()
                .name(orderAdditionalDetails.get("formdata").get(getFormData(order.getOrderType())).asText())
                .address(objectMapper.convertValue(caseAdditionalDetails.get("respondentDetails").get("formdata").get(0).get("data").get("addressDetails").get(0).get("addressDetails"), Address.class))
                .age(null)
                .phone(null)
                .build();
    }

    private DeliveryChannel buildDeliveryChannel() {
        return DeliveryChannel.builder()
                .channelName(ChannelName.POLICE)
                .paymentFees("0") //need to call payment calculator (channelId="POLICE", receiverPincode: caseAdditionalDetails.get("respondentDetails").get("formdata").get(0).get("data").get("addressDetails").get(0).get("addressDetails").get("pincode"), taskType: orderType
                .build();
    }


    private SummonsDetails buildSummonDetails(Order order, CourtCase caseDetails) {
        JsonNode additionalDetails = objectMapper.convertValue(order.getAdditionalDetails(), JsonNode.class);
        JsonNode orderFormValue = additionalDetails.get("formdata").get("SummonsOrder");
        return SummonsDetails.builder()
                .issueDate(order.getAuditDetails().getLastModifiedTime())
                .caseFilingDate(caseDetails.getFilingDate())
                .docSubType(orderFormValue.get("party").get("data").get("partyType").asText().equals("Witness") ? "WITNESS" : "ACCUSED").build();
    }

    private ComplainantDetails buildComplainantDetails(CourtCase courtCase) {
        JsonNode additionalDetails = objectMapper.convertValue(courtCase.getAdditionalDetails(), JsonNode.class);
        String individualId = courtCase.getLitigants().stream()
                .filter(item -> item.getPartyType().equals("complainant.primary"))
                .map(Party::getIndividualId).findFirst().orElse(null);
        Individual individual = individualService.getIndividualsByIndividualId(RequestInfo.builder().build(), individualId).get(0);
        org.egov.common.models.individual.Address individualAddress = individual.getAddress().get(0);
        JsonNode data = additionalDetails.get("complainantDetails").get("formdata").get(0).get("data");
        return ComplainantDetails.builder()
                .name(getComplainantName(data))
                .address(getComplainantAddress(individualAddress)).build();
    }

    @NotNull
    private static String getComplainantName(JsonNode complainantDetails) {
        String firstName = complainantDetails.has("firstName") && !complainantDetails.get("firstName").isNull() ? complainantDetails.get("firstName").asText().trim() : "";
        String lastName = complainantDetails.has("lastName") && !complainantDetails.get("lastName").isNull() ? complainantDetails.get("lastName").asText().trim() : "";

        String partyName = Stream.of(firstName, lastName)
                .filter(name -> !name.isEmpty())  // Remove empty values
                .collect(Collectors.joining(" ")); // Join with a space

        if (complainantDetails.get("complainantType").get("code") != null &&
                "INDIVIDUAL".equals(complainantDetails.get("complainantType").get("code").asText())) {
            return partyName;
        }

        String companyName = complainantDetails.get("complainantCompanyName") != null
                ? complainantDetails.get("complainantCompanyName").asText().trim()
                : "";

        return companyName.isEmpty() ? partyName : companyName + " (Represented By " + partyName + ")";

    }

    private @Valid Address getComplainantAddress(org.egov.common.models.individual.Address individualAddress) {
        return Address.builder()
                .pinCode(individualAddress.getPincode())
                .district(individualAddress.getAddressLine2())
                .city(individualAddress.getCity())
                .state(individualAddress.getAddressLine1())
                .coordinate(Coordinate.builder()
                        .x(individualAddress.getLatitude().floatValue())
                        .y(individualAddress.getLongitude().floatValue())
                        .build())
                .locality(Stream.of(individualAddress.getDoorNo(),
                                individualAddress.getBuildingName(),
                                individualAddress.getStreet())
                        .filter(Objects::nonNull)
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.joining(", "))).build();

    }

    private NoticeDetails buildNoticeDetails(CourtCase courtCase, Order order) {
        JsonNode additionalDetails = objectMapper.convertValue(order.getAdditionalDetails(), JsonNode.class);
        JsonNode orderFormData = additionalDetails.get("formdata");
        JsonNode orderFormValue = orderFormData.get("noticeOrder");
        return NoticeDetails.builder()
                .caseFilingDate(courtCase.getFilingDate())
                .issueDate(order.getAuditDetails().getLastModifiedTime())
                .partyIndex(orderFormData.get("party").get("data").get("partyIndex").asText())
                .noticeType(orderFormData.get("noticeType").get("type").asText())
                .docSubType(orderFormValue.get("party").get("data").get("partyType").asText().equals("Witness") ? "WITNESS" : "ACCUSED").build();
    }

}




