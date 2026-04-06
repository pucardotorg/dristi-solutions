package pucar.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.Document;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.egov.tracer.model.ServiceCallException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import pucar.config.Configuration;
import pucar.repository.ServiceRequestRepository;
import pucar.web.models.Order;
import pucar.web.models.WorkflowObject;
import pucar.web.models.courtCase.CourtCase;
import pucar.web.models.task.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static pucar.config.ServiceConstants.*;

@Component
@Slf4j
public class TaskUtil {

    private final RestTemplate restTemplate;
    private final ServiceRequestRepository serviceRequestRepository;
    private final ObjectMapper objectMapper;
    private final DateUtil dateUtil;
    private final JsonUtil jsonUtil;
    private final Configuration config;

    public TaskUtil(RestTemplate restTemplate, ServiceRequestRepository serviceRequestRepository, ObjectMapper objectMapper, DateUtil dateUtil, JsonUtil jsonUtil, Configuration config) {
        this.restTemplate = restTemplate;
        this.serviceRequestRepository = serviceRequestRepository;
        this.objectMapper = objectMapper;
        this.dateUtil = dateUtil;
        this.jsonUtil = jsonUtil;
        this.config = config;
    }

    public TaskResponse callCreateTask(TaskRequest taskRequest) {
        try {
            StringBuilder uri = new StringBuilder();
            uri.append(config.getTaskServiceHost()).append(config.getTaskServiceCreateEndpoint());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<TaskRequest> requestEntity = new HttpEntity<>(taskRequest, headers);

            ResponseEntity<TaskResponse> responseEntity = restTemplate.postForEntity(uri.toString(),
                    requestEntity, TaskResponse.class);
            log.info("Response of create task :: {}", requestEntity.getBody());

            return responseEntity.getBody();
        } catch (Exception e) {
            log.error("Error getting response from Task Service", e);
            throw new CustomException("TASK_CREATE_ERROR", "Error getting response from task Service");
        }
    }

    public TaskListResponse searchTask(TaskSearchRequest request) {

        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(config.getTaskServiceHost()).append(config.getTaskSearchEndpoint());
        Object response = serviceRequestRepository.fetchResult(uri, request);

        try {
            JsonNode jsonNode = objectMapper.valueToTree(response);
            return objectMapper.readValue(jsonNode.toString(), TaskListResponse.class);
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
            throw new CustomException(); // add log and code
        }

    }

    public TaskResponse updateTask(TaskRequest request) {

        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        StringBuilder uri = new StringBuilder(config.getTaskServiceHost()).append(config.getTaskUpdateEndPoint());
        Object response = serviceRequestRepository.fetchResult(uri, request);

        try {
            JsonNode jsonNode = objectMapper.valueToTree(response);
            return objectMapper.readValue(jsonNode.toString(), TaskResponse.class);
        } catch (HttpClientErrorException e) {
            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
            throw new ServiceCallException(e.getResponseBodyAsString());
        } catch (Exception e) {
            log.error(SEARCHER_SERVICE_EXCEPTION, e);
            throw new CustomException(); // add log and code
        }

    }


    public TaskRequest createTaskRequest(RequestInfo requestInfo, Order order, Object taskDetails, CourtCase courtCase, String channel) {
        String itemId = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("itemId"), String.class);

        Map<String, Object> additionalDetails = new HashMap<>();
        if (itemId!= null){
            additionalDetails.put("itemId",itemId);
        }

        WorkflowObject workflowObject = new WorkflowObject();
        if (EMAIL.equalsIgnoreCase(channel) || SMS.equalsIgnoreCase(channel) || courtCase.getIsLPRCase() ||
                isCourtWitness(order.getOrderType(), objectMapper.convertValue(taskDetails, JsonNode.class))) {
            workflowObject.setAction("CREATE_WITH_OUT_PAYMENT");
            // There is no pending collection when payment is not made
            ObjectNode taskDetailsNode = (ObjectNode) taskDetails;
            ObjectNode deliveryChannels = (ObjectNode) taskDetailsNode.get("deliveryChannels");
            if (deliveryChannels == null) {
                deliveryChannels = objectMapper.createObjectNode();
                taskDetailsNode.set("deliveryChannels", deliveryChannels);
            }
            deliveryChannels.put("isPendingCollection", false);
        }
        else {
            workflowObject.setAction("CREATE");
        }
        workflowObject.setComments(order.getOrderType());
        workflowObject.setDocuments(Collections.singletonList(Document.builder().build()));

        Task task = Task.builder()
                .tenantId(order.getTenantId())
                .orderId(order.getId())
                .filingNumber(order.getFilingNumber())
                .cnrNumber(order.getCnrNumber())
                .createdDate(dateUtil.getCurrentTimeInMilis())
                .taskType(order.getOrderType())
                .caseId(courtCase.getId().toString())
                .caseTitle(courtCase.getCaseTitle())
                .taskDetails(taskDetails)
                .amount(Amount.builder().type("FINE").status("DONE").amount("0").build()) // here amount need to fetch from somewhere
                .status("INPROGRESS")
                .additionalDetails(additionalDetails) // here new hashmap
                .workflow(workflowObject)
                .build();

         return TaskRequest.builder().requestInfo(requestInfo).task(task).build();
    }

    public boolean isCourtWitness(String orderType, JsonNode taskDetails) {
        if(Set.of(WARRANT, PROCLAMATION, ATTACHMENT).contains(orderType.toUpperCase())){
            return taskDetails.get("respondentDetails")!=null && (taskDetails.get("respondentDetails").get("ownerType") != null &&
                    taskDetails.get("respondentDetails").get("ownerType").textValue().equalsIgnoreCase(COURT_WITNESS));
        } if(SUMMONS.equalsIgnoreCase(orderType)) {
            return taskDetails.get("witnessDetails") != null && (taskDetails.get("witnessDetails").get("ownerType") == null ||
                    taskDetails.get("witnessDetails").get("ownerType").textValue().equalsIgnoreCase(COURT_WITNESS));
        }
        return false;
    }

    /**
     * Creates a TaskRequest for WARRANT order type with upfront payment check.
     * If hasUpfrontPayment is true, uses CREATE action (requires payment).
     * If hasUpfrontPayment is false, uses CREATE_WITH_OUT_PAYMENT action.
     */
    public TaskRequest createWarrantTaskRequest(RequestInfo requestInfo, Order order, Object taskDetails, 
                                                 CourtCase courtCase, String channel, boolean hasUpfrontPayment) {

        String itemId = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("itemId"), String.class);

        Map<String, Object> additionalDetails = new HashMap<>();
        if (itemId != null) {
            additionalDetails.put("itemId", itemId);
        }

        WorkflowObject workflowObject = new WorkflowObject();
        JsonNode taskDetailsNode = objectMapper.convertValue(taskDetails, JsonNode.class);
        
        // Determine workflow action based on upfront payment status
        // hasUpfrontPayment=true means payment was done upfront, so no payment required now
        // hasUpfrontPayment=false means no upfront payment found, so payment is required
        if (EMAIL.equalsIgnoreCase(channel) || SMS.equalsIgnoreCase(channel) || courtCase.getIsLPRCase() ||
                isCourtWitness(order.getOrderType(), taskDetailsNode) || hasUpfrontPayment) {
            workflowObject.setAction("CREATE_WITH_OUT_PAYMENT");
            log.info("Creating warrant task without payment - channel: {}, hasUpfrontPayment: {}", channel, hasUpfrontPayment);
            // There is no pending collection when payment is not made
            ObjectNode taskDetailsObjNode = (ObjectNode) taskDetails;
            ObjectNode deliveryChannels = (ObjectNode) taskDetailsObjNode.get("deliveryChannels");
            if (deliveryChannels == null) {
                deliveryChannels = objectMapper.createObjectNode();
                taskDetailsObjNode.set("deliveryChannels", deliveryChannels);
            }
            deliveryChannels.put("isPendingCollection", false);
            if (hasUpfrontPayment) {
                LocalDate feePaidDate = dateUtil.getLocalDateFromEpoch(courtCase.getFilingDate());
                deliveryChannels.put("feePaidDate", feePaidDate.format(DateTimeFormatter.ofPattern(LOCAL_DATE_FORMAT)));
                if (RPAD.equalsIgnoreCase(channel)) {
                    deliveryChannels.put("isPendingCollection", true);
                }

            }
        } else {
            workflowObject.setAction("CREATE");
            log.info("Creating warrant task with payment - channel: {}, hasUpfrontPayment: {}", channel, hasUpfrontPayment);
        }
        workflowObject.setComments(order.getOrderType());
        workflowObject.setDocuments(Collections.singletonList(Document.builder().build()));

        Task task = Task.builder()
                .tenantId(order.getTenantId())
                .orderId(order.getId())
                .filingNumber(order.getFilingNumber())
                .cnrNumber(order.getCnrNumber())
                .createdDate(dateUtil.getCurrentTimeInMilis())
                .taskType(order.getOrderType())
                .caseId(courtCase.getId().toString())
                .caseTitle(courtCase.getCaseTitle())
                .taskDetails(taskDetails)
                .amount(Amount.builder().type("FINE").status("DONE").amount("0").build())
                .status("INPROGRESS")
                .additionalDetails(additionalDetails)
                .workflow(workflowObject)
                .build();

        return TaskRequest.builder().requestInfo(requestInfo).task(task).build();
    }

    public String constructFullName(String firstName, String middleName, String lastName) {
        return Stream.of(firstName, middleName, lastName)
                .filter(name -> name != null && !name.isEmpty()) // Remove null and empty values
                .collect(Collectors.joining(" ")) // Join with space
                .trim();
    }

    public String getFormattedName(String firstName, String middleName, String lastName, String designation, String partyTypeLabel) {
        // Build the name parts while filtering out null/empty values
        String nameParts = Stream.of(firstName, middleName, lastName)
                .filter(name -> name != null && !name.isEmpty())
                .collect(Collectors.joining(" "));

        // Handle designation
        String nameWithDesignation = (designation != null && !designation.isEmpty() && !nameParts.isEmpty())
                ? nameParts + " - " + designation
                : (designation != null && !designation.isEmpty()) ? designation : nameParts;

        // Handle party type label
        return (partyTypeLabel != null && !partyTypeLabel.isEmpty())
                ? nameWithDesignation + " " + partyTypeLabel
                : nameWithDesignation;
    }
}

