package pucar.strategy.ordertype;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import pucar.config.StateSlaMap;
import pucar.service.SmsNotificationService;
import pucar.strategy.OrderUpdateStrategy;
import pucar.util.*;
import pucar.web.models.Order;
import pucar.web.models.OrderRequest;
import pucar.web.models.SMSTemplateData;
import pucar.web.models.adiary.CaseDiaryEntry;
import pucar.web.models.courtCase.*;
import pucar.web.models.pendingtask.PendingTask;
import pucar.web.models.pendingtask.PendingTaskRequest;
import pucar.web.models.task.TaskRequest;
import pucar.web.models.task.TaskResponse;

import java.util.*;

import static pucar.config.ServiceConstants.*;

@Component
@Slf4j
public class PublishMiscellaneousProcess implements OrderUpdateStrategy {

    private final TaskUtil taskUtil;
    private final ObjectMapper objectMapper;
    private final CaseUtil caseUtil;
    private final PendingTaskUtil pendingTaskUtil;
    private final JsonUtil jsonUtil;
    private final AdvocateUtil advocateUtil;
    private final UserUtil userUtil;
    private final SmsNotificationService smsNotificationService;

    @Autowired
    public PublishMiscellaneousProcess(TaskUtil taskUtil, ObjectMapper objectMapper, CaseUtil caseUtil, PendingTaskUtil pendingTaskUtil, JsonUtil jsonUtil, AdvocateUtil advocateUtil, UserUtil userUtil, SmsNotificationService smsNotificationService) {
        this.taskUtil = taskUtil;
        this.objectMapper = objectMapper;
        this.caseUtil = caseUtil;
        this.pendingTaskUtil = pendingTaskUtil;
        this.jsonUtil = jsonUtil;
        this.advocateUtil = advocateUtil;
        this.userUtil = userUtil;
        this.smsNotificationService = smsNotificationService;
    }

    @Override
    public boolean supportsPreProcessing(OrderRequest orderRequest) {
        return false;
    }

    @Override
    public boolean supportsPostProcessing(OrderRequest orderRequest) {
        Order order = orderRequest.getOrder();
        String action = order.getWorkflow().getAction();
        return order.getOrderType() != null && E_SIGN.equalsIgnoreCase(action) && MISCELLANEOUS_PROCESS.equalsIgnoreCase(order.getOrderType());
    }

    @Override
    public OrderRequest preProcess(OrderRequest orderRequest) {
        return null;
    }

    @Override
    public OrderRequest postProcess(OrderRequest orderRequest) {

        // create task base on no of task details item
        Order order = orderRequest.getOrder();
        RequestInfo requestInfo = orderRequest.getRequestInfo();
        log.info("After order publish process,result = IN_PROGRESS, orderType :{}, orderNumber:{}", order.getOrderType(), order.getOrderNumber());

        // case search and update
        CaseListResponse caseListResponse = caseUtil.searchCaseDetails(CaseSearchRequest.builder()
                .criteria(Collections.singletonList(CaseCriteria.builder().filingNumber(order.getFilingNumber()).tenantId(order.getTenantId()).defaultFields(false).build()))
                .requestInfo(requestInfo).build());

        List<CourtCase> cases = caseListResponse.getCriteria().get(0).getResponseList();

        // add validation here
        CourtCase courtCase = cases.get(0);

        String taskDetails = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("taskDetails"), String.class);
        try {
            JsonNode taskDetailsArray = objectMapper.readTree(taskDetails);
            log.info("taskDetailsArray:{}", taskDetailsArray.size());

            for (JsonNode taskDetail : taskDetailsArray) {
                String taskDetailString = objectMapper.writeValueAsString(taskDetail);
                Map<String, Object> jsonMap = objectMapper.readValue(taskDetailString, new TypeReference<>() {
                });
                String channel = jsonUtil.getNestedValue(jsonMap, Arrays.asList("deliveryChannels", "channelCode"), String.class);

                TaskRequest taskRequest = taskUtil.createTaskRequestForSummonWarrantAndNotice(requestInfo, order, taskDetail, courtCase, channel);
                TaskResponse taskResponse = taskUtil.callCreateTask(taskRequest);
            }
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        return null;
    }

    private String getPartyType(Order order) {
        Object additionalDetails = order.getAdditionalDetails();
        JsonNode additionalDetailsNode = objectMapper.convertValue(additionalDetails, JsonNode.class);

        JsonNode partyTypeNode = additionalDetailsNode
                .path("formdata")
                .path("warrantFor")
                .path("party")
                .path("data")
                .path("partyType");

        String partyType = partyTypeNode.textValue();
        return partyType == null ? null : partyType.substring(0, 1).toUpperCase() + partyType.substring(1).toLowerCase();
    }

    private void callNotificationService(OrderRequest orderRequest, String messageCode, SMSTemplateData smsTemplateData, List<User> users) {
        try {
            List<String> uuids = users.stream()
                    .map(User::getUuid)
                    .toList();

            List<User> userList = userUtil.getUserListFromUserUuid(uuids);
            List<String> phoneNumbers = userList.stream()
                    .map(User::getMobileNumber)
                    .toList();

            for (String number : phoneNumbers) {
                smsNotificationService.sendNotification(orderRequest.getRequestInfo(), smsTemplateData, messageCode, number);
            }
        }
        catch (Exception e) {
            log.error("Error occurred while sending notification: {}", e.toString());
        }
    }

    private boolean isWarrantForAccusedWitness(Order order) {
        String taskDetails = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("taskDetails"), String.class);
        try {
            JsonNode taskDetailsArray = objectMapper.readTree(taskDetails);
            JsonNode taskDetail = taskDetailsArray.get(0);
            if(taskDetail.get("respondentDetails") != null
                    && taskDetail.get("respondentDetails").get("ownerType") != null
                    && taskDetail.get("respondentDetails").get("ownerType").textValue().equalsIgnoreCase(ACCUSED)){
                return true;
            }
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

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

}




