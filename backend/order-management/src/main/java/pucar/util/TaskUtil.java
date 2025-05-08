package pucar.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import net.minidev.json.JSONObject;
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
import pucar.web.models.Address;
import pucar.web.models.Order;
import pucar.web.models.WorkflowObject;
import pucar.web.models.courtCase.CourtCase;
import pucar.web.models.task.*;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static pucar.config.ServiceConstants.EXTERNAL_SERVICE_EXCEPTION;
import static pucar.config.ServiceConstants.SEARCHER_SERVICE_EXCEPTION;

@Component
@Slf4j
public class TaskUtil {

    private final RestTemplate restTemplate;
    private final ServiceRequestRepository serviceRequestRepository;
    private final ObjectMapper objectMapper;
    private final DateUtil dateUtil;
    private final JsonUtil jsonUtil;
    private final Configuration config;
    private final MdmsUtil mdmsUtil;

    public TaskUtil(RestTemplate restTemplate, ServiceRequestRepository serviceRequestRepository, ObjectMapper objectMapper, DateUtil dateUtil, JsonUtil jsonUtil, Configuration config, MdmsUtil mdmsUtil) {
        this.restTemplate = restTemplate;
        this.serviceRequestRepository = serviceRequestRepository;
        this.objectMapper = objectMapper;
        this.dateUtil = dateUtil;
        this.jsonUtil = jsonUtil;
        this.config = config;
        this.mdmsUtil = mdmsUtil;
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


    public TaskRequest createTaskRequestForSummonWarrantAndNotice(RequestInfo requestInfo, Order order, Object taskDetails, CourtCase courtCase) {

        Map<String, Map<String, JSONArray>> courtRooms = mdmsUtil.fetchMdmsData(requestInfo, order.getTenantId(), "common-masters", List.of("Court_Rooms"));

        JSONArray courtRoomsArray = courtRooms.get("common-masters").get("Court_Rooms");

        Map<String, Object> courtDetails = getCourtDetails(courtRoomsArray, courtCase);

        String itemId = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("itemId"), String.class);

        Map<String, Object> additionalDetails = new HashMap<>();
        if (itemId != null) {
            additionalDetails.put("itemId", itemId);
        }

        WorkflowObject workflowObject = new WorkflowObject();
        workflowObject.setAction("CREATE");
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

    @SuppressWarnings("unchecked")
    private Map<String, Object> getCourtDetails(JSONArray courtRoomsArray, CourtCase courtCase) {
        Map<String, Object> courtDetails = (Map<String, Object>) courtRoomsArray.stream()
                .filter(obj -> {
                    if (courtCase == null || !(obj instanceof Map)) return false;
                    Map data = (Map) obj;
                    return courtCase.getCourtId() != null && courtCase.getCourtId().equals(data.get("code"));
                })
                .findFirst()
                .orElseGet(HashMap::new);

        return courtDetails;
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


    public TaskDetails getTaskDetails(Order order, CourtCase courtCase, Map<String, Object> courtDetails) {

        TaskDetails taskDetails = TaskDetails.builder().build();

        getSummonWarrantOrNoticeDetails(order, taskDetails, courtCase);
        getRespondentDetails(order, taskDetails, courtCase);
        getWitnessDetails(order, taskDetails, courtCase);
        getCaseDetails(order, taskDetails, courtCase, courtDetails);
        getDeliveryChannel(order, taskDetails, courtCase);
        return taskDetails;

    }

    private void getDeliveryChannel(Order order, TaskDetails taskDetails, CourtCase courtCase) throws JsonProcessingException {

        Object orderFormData = getOrderFormDataByOrderType(order.getAdditionalDetails(), order.getOrderType());

        Object deliveryChannel = jsonUtil.getNestedValue(orderFormData, List.of("selectedChannels"), Object.class);

        JSONArray deliveryChannelArray = objectMapper.convertValue(objectMapper.writeValueAsBytes(deliveryChannel), JSONArray.class);

        for (int i = 0; i < deliveryChannelArray.size(); i++) {
            JSONObject channel = (JSONObject) deliveryChannelArray.get(i);

        }




    }

    private void getCaseDetails(Order order, TaskDetails taskDetails, CourtCase courtCase, Map<String, Object> courtDetails) {

        String hearingDate = jsonUtil.getNestedValue(order.getAdditionalDetails(), Arrays.asList("formdata", "dateOfHearing"), String.class);
        Long hearingDateEpoch = null;
        if (hearingDate != null) hearingDateEpoch = dateUtil.getEpochFromDateString(hearingDate, "yyyy-MM-dd");

        CaseDetails caseDetails = CaseDetails.builder()
                .caseTitle(courtCase.getCaseTitle())
                .caseYear(null)
                .hearingDate(hearingDateEpoch)
                .courtName(courtDetails.get("name").toString())
                .courtAddress(courtDetails.get("address").toString())
                .courtId(courtDetails.get("code").toString())
                .hearingNumber(order.getHearingNumber())
                .judgeName(config.getJudgeName())
                .build();
        taskDetails.setCaseDetails(caseDetails);
    }

    private void getWitnessDetails(Order order, TaskDetails taskDetails, CourtCase courtCase) {

        Object orderFormData = getOrderFormDataByOrderType(order.getAdditionalDetails(), order.getOrderType());
        String docSubType = jsonUtil.getNestedValue(orderFormData, Arrays.asList("party", "data", "partyType"), String.class);
        RespondentDetails respondentDetails = null;

        if (docSubType != null) {
            respondentDetails = docSubType.equals("Witness") ? getRespondentAccused(order, courtCase) : null;
        }

        taskDetails.setRespondentDetails(respondentDetails);
    }

    private void getRespondentDetails(Order order, TaskDetails taskDetails, CourtCase courtCase) {


        Object orderFormData = getOrderFormDataByOrderType(order.getAdditionalDetails(), order.getOrderType());
        String docSubType = jsonUtil.getNestedValue(orderFormData, Arrays.asList("party", "data", "partyType"), String.class);
        RespondentDetails respondentDetails = null;

        if (docSubType != null) {
            respondentDetails = docSubType.equals("Witness") ? getCaseRespondentFromCourtCase(courtCase) : getRespondentAccused(order, courtCase);
        }

        taskDetails.setRespondentDetails(respondentDetails);

    }

    private RespondentDetails getRespondentAccused(Order order, CourtCase courtCase) {
        String respondentName = getRespondentName(order.getAdditionalDetails(), order.getOrderType());
        List<Address> respondentAddress = getRespondentAddress(order, courtCase);
        String email = getRespondentEmails(order.getAdditionalDetails()).get(0);
        String phone = getRespondentPhoneNumbers(order.getAdditionalDetails()).get(0);

        return RespondentDetails.builder()
                .name(respondentName)
                .address(respondentAddress.get(0))
                .age(null)
                .email(email)
                .phone(phone)
                .gender(null).build();
    }

    private List<Address> getRespondentAddress(Order order, CourtCase courtCase) {
        Object additionalDetails = order.getAdditionalDetails();
        String orderType = order.getOrderType();
        Object orderFormData = getOrderFormDataByOrderType(additionalDetails, orderType);

        // 2. Try to get addressDetails from orderFormData
        if (orderFormData instanceof Map) {
            Object addressDetailsObj = ((Map<?, ?>) orderFormData).get("addressDetails");
            if (addressDetailsObj instanceof List) {
                List<?> detailsList = (List<?>) addressDetailsObj;
                List<Address> addresses = new ArrayList<>();
                for (Object data : detailsList) {
                    if (data instanceof Map) {
                        Object innerAddress = ((Map<?, ?>) data).get("addressDetails");
                        if (innerAddress instanceof Map) {
                            Address addr = objectMapper.convertValue(innerAddress, Address.class);
                            addresses.add(addr);
                        } else if (innerAddress instanceof Address) {
                            addresses.add((Address) innerAddress);
                        }
                    }
                }
                if (!addresses.isEmpty()) return addresses;
            }
        }

        // 3. Try to get respondentNameData address
        Object respondentNameData = null;
        if (orderFormData != null) {
            respondentNameData = jsonUtil.getNestedValue(additionalDetails, Arrays.asList("party", "data"), Object.class);
        }
        if (respondentNameData instanceof Map) {
            Object addressObj = ((Map<?, ?>) respondentNameData).get("address");
            if (addressObj instanceof List) {
                List<?> addressList = (List<?>) addressObj;
                List<Address> addresses = new ArrayList<>();
                for (Object addr : addressList) {
                    if (addr instanceof Map) {
                        addresses.add(objectMapper.convertValue(addr, Address.class));
                    } else if (addr instanceof Address) {
                        addresses.add((Address) addr);
                    }
                }
                if (!addresses.isEmpty()) return addresses;
            } else if (addressObj instanceof Map) {
                // Single address object
                return List.of(objectMapper.convertValue(addressObj, Address.class));
            } else if (addressObj instanceof Address) {
                return List.of((Address) addressObj);
            }
        }

        // 4. Fallback: caseDetails.additionalDetails.respondentDetails.formdata[0].data.addressDetails
        Object caseDetailsObj = courtCase.getCaseDetails();
        if (caseDetailsObj instanceof Map) {
            Object additional = ((Map<?, ?>) caseDetailsObj).get("additionalDetails");
            if (additional instanceof Map) {
                Object respondentDetails = ((Map<?, ?>) additional).get("respondentDetails");
                if (respondentDetails instanceof Map) {
                    Object formdata = ((Map<?, ?>) respondentDetails).get("formdata");
                    if (formdata instanceof List) {
                        List<?> formdataList = (List<?>) formdata;
                        if (!formdataList.isEmpty()) {
                            Object dataObj = ((Map<?, ?>) formdataList.get(0)).get("data");
                            if (dataObj instanceof Map) {
                                Object addressDetailsObj = ((Map<?, ?>) dataObj).get("addressDetails");
                                if (addressDetailsObj instanceof List) {
                                    List<?> detailsList = (List<?>) addressDetailsObj;
                                    List<Address> addresses = new ArrayList<>();
                                    for (Object data : detailsList) {
                                        if (data instanceof Map) {
                                            Object innerAddress = ((Map<?, ?>) data).get("addressDetails");
                                            if (innerAddress instanceof Map) {
                                                addresses.add(objectMapper.convertValue(innerAddress, Address.class));
                                            } else if (innerAddress instanceof Address) {
                                                addresses.add((Address) innerAddress);
                                            }
                                        }
                                    }
                                    if (!addresses.isEmpty()) return addresses;
                                }
                            }
                        }
                    }
                }
            }
        }
        return Collections.emptyList();
    }

    private String getRespondentName(Object additionalDetails, String orderType) {
        Object respondentNameData = null;

        Object orderFormData = getOrderFormDataByOrderType(additionalDetails, orderType);
        if (orderFormData != null) {
            respondentNameData = jsonUtil.getNestedValue(additionalDetails, Arrays.asList("party", "data"), Object.class);
        }

        if (respondentNameData == null) {
            return null;
        }

        boolean isWitness = ((Map<String, Object>) respondentNameData).getOrDefault("partyType", "").toString().equalsIgnoreCase("witness");
        String partyName = isWitness
                ? getFormattedName(
                (String) ((Map<String, Object>) respondentNameData).get("firstName"),
                (String) ((Map<String, Object>) respondentNameData).get("middleName"),
                (String) ((Map<String, Object>) respondentNameData).get("lastName"),
                (String) ((Map<String, Object>) respondentNameData).get("witnessDesignation"),
                null)
                : constructFullName(
                (String) ((Map<String, Object>) respondentNameData).get("firstName"),
                (String) ((Map<String, Object>) respondentNameData).get("middleName"),
                (String) ((Map<String, Object>) respondentNameData).get("lastName"));

        if (((Map<String, Object>) respondentNameData).get("respondentCompanyName") != null) {
            return String.format("%s (Represented By %s)", ((Map<String, Object>) respondentNameData).get("respondentCompanyName"), partyName);
        }
        return partyName != null ? partyName : String.valueOf(respondentNameData);
    }

    private void getSummonWarrantOrNoticeDetails(Order order, TaskDetails taskDetails, CourtCase courtCase) {

        String orderType = order.getOrderType();

        Object orderFormValue = jsonUtil.getNestedValue(order.getAdditionalDetails(), Arrays.asList("formdata"), Object.class);
        Object orderFormData = getOrderFormDataByOrderType(order.getAdditionalDetails(), orderType);


        switch (orderType) {
            case "SUMMONS" -> {

                String docSubType = jsonUtil.getNestedValue(orderFormData, Arrays.asList("party", "data", "partyType"), String.class);
                if (docSubType != null) {
                    docSubType = docSubType.equals("Witness") ? "WITNESS" : "ACCUSED";
                }

                SummonsDetails summonsDetails = SummonsDetails.builder()
                        .docSubType(docSubType)
                        .caseFilingDate(courtCase.getFilingDate())
                        .issueDate(order.getAuditDetails().getLastModifiedTime()).build();
                taskDetails.setSummonDetails(summonsDetails);
            }
            case "WARRANT" -> {

                String docType = jsonUtil.getNestedValue(orderFormValue, Arrays.asList("warrantType", "code"), String.class);
                Boolean isBailable = jsonUtil.getNestedValue(orderFormValue, Arrays.asList("bailInfo", "isBailable", "code"), Boolean.class);
                String docSubType = "NON_BAILABLE";
                if (isBailable) {
                    docSubType = "BAILABLE";

                }
                String surety = jsonUtil.getNestedValue(orderFormValue, Arrays.asList("bailInfo", "noOfSureties", "code"), String.class);
                Double bailableAmount = jsonUtil.getNestedValue(orderFormValue, Arrays.asList("bailInfo", "bailableAmount"), Double.class);
                WarrantDetails warrantDetails = WarrantDetails.builder()
                        .caseFilingDate(courtCase.getFilingDate())
                        .issueDate(order.getAuditDetails().getLastModifiedTime())
                        .docType(docType).docSubType(docSubType)
                        .surety(surety)
                        .bailableAmount(bailableAmount).build();

                taskDetails.setWarrantDetails(warrantDetails);
            }
            case "NOTICE" -> {

                String docSubType = jsonUtil.getNestedValue(orderFormData, Arrays.asList("party", "data", "partyType"), String.class);
                if (docSubType != null) {
                    docSubType = docSubType.equals("Witness") ? "WITNESS" : "ACCUSED";
                }

                String noticeType = jsonUtil.getNestedValue(orderFormValue, Arrays.asList("noticeType", "type"), String.class);
                String partyType = jsonUtil.getNestedValue(orderFormData, Arrays.asList("party", "data", "partyIndex"), String.class);
                NoticeDetails noticeDetails = NoticeDetails.builder()
                        .caseFilingDate(courtCase.getFilingDate())
                        .issueDate(order.getAuditDetails().getLastModifiedTime())
                        .noticeType(noticeType)
                        .docSubType(docSubType)
                        .partyIndex(partyType)
                        .build();

                taskDetails.setNoticeDetails(noticeDetails);

            }
        }
    }


    private Object getOrderFormDataByOrderType(Object additionalDetails, String orderType) {
        Object orderFormData = null;
        if (additionalDetails != null) {
            switch (orderType) {
                case "SUMMONS" ->
                        orderFormData = jsonUtil.getNestedValue(additionalDetails, Arrays.asList("formdata", "SummonsOrder"), Object.class);
                case "WARRANT" ->
                        orderFormData = jsonUtil.getNestedValue(additionalDetails, Arrays.asList("formdata", "warrantFor"), Object.class);
                case "NOTICE" ->
                        orderFormData = jsonUtil.getNestedValue(additionalDetails, Arrays.asList("formdata", "noticeOrder"), Object.class);
            }
        }
        return orderFormData;
    }

    /**
     * Safely extracts respondent phone numbers from orderFormData using jsonUtil.
     * Equivalent to: orderFormData?.party?.data?.phone_numbers || []
     */
    @SuppressWarnings("unchecked")
    public List<String> getRespondentPhoneNumbers(Object orderFormData) {
        if (orderFormData == null) return Collections.emptyList();
        Map<?, ?> party = jsonUtil.getNestedValue(orderFormData, List.of("party"), Map.class);
        if (party == null) return Collections.emptyList();
        Map<?, ?> data = jsonUtil.getNestedValue(party, List.of("data"), Map.class);
        if (data == null) return Collections.emptyList();
        List<String> phoneNumbers = jsonUtil.getNestedValue(data, List.of("phone_numbers"), List.class);
        return phoneNumbers != null ? phoneNumbers : Collections.emptyList();
    }

    /**
     * Safely extracts respondent emails from orderFormData using jsonUtil.
     * Equivalent to: orderFormData?.party?.data?.email || []
     */
    @SuppressWarnings("unchecked")
    public List<String> getRespondentEmails(Object orderFormData) {
        if (orderFormData == null) return Collections.emptyList();
        Map<?, ?> party = jsonUtil.getNestedValue(orderFormData, List.of("party"), Map.class);
        if (party == null) return Collections.emptyList();
        Map<?, ?> data = jsonUtil.getNestedValue(party, List.of("data"), Map.class);
        if (data == null) return Collections.emptyList();
        List<String> emails = jsonUtil.getNestedValue(data, List.of("email"), List.class);
        return emails != null ? emails : Collections.emptyList();
    }

    // Equivalent of getComplainantName in JS
    public String getComplainantName(Map<String, Object> complainantDetails) {
        if (complainantDetails == null) return "";
        String firstName = jsonUtil.getNestedValue(complainantDetails, List.of("firstName"), String.class);
        String lastName = jsonUtil.getNestedValue(complainantDetails, List.of("lastName"), String.class);
        String partyName = ((firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "")).trim();
        Map<?, ?> complainantTypeObj = jsonUtil.getNestedValue(complainantDetails, List.of("complainantType"), Map.class);
        String complainantTypeCode = complainantTypeObj != null ? (String) complainantTypeObj.get("code") : null;
        if ("INDIVIDUAL".equalsIgnoreCase(complainantTypeCode)) {
            return partyName;
        }
        String companyName = jsonUtil.getNestedValue(complainantDetails, List.of("complainantCompanyName"), String.class);
        if (companyName != null && !companyName.isEmpty()) {
            return String.format("%s (Represented By %s)", companyName, partyName);
        }
        return "";
    }

    // Equivalent of: getComplainantName(caseDetails?.additionalDetails?.complainantDetails?.formdata[0]?.data)
    public String getComplainantNameFromCase(CourtCase courtCase) {
        if (courtCase == null) return "";
        Object caseDetailsObj = courtCase.getCaseDetails();
        Map<?, ?> additional = jsonUtil.getNestedValue(caseDetailsObj, List.of("additionalDetails"), Map.class);
        Map<?, ?> complainantDetailsObj = jsonUtil.getNestedValue(additional, List.of("complainantDetails"), Map.class);
        List<?> formdataList = jsonUtil.getNestedValue(complainantDetailsObj, List.of("formdata"), List.class);
        if (formdataList == null || formdataList.isEmpty()) return "";
        Map<String, Object> complainantDetails = jsonUtil.getNestedValue((Map<?, ?>) formdataList.get(0), List.of("data"), Map.class);
        return getComplainantName(complainantDetails);
    }

    /**
     * Extracts complainant address fields from individualDetail JsonObject structure, returns as Map<String, Object>.
     * Mirrors the JS logic for complainantAddress.
     */
    public Map<String, Object> getComplainantAddressFromIndividualDetail(Map<String, Object> individualDetail) {
        if (individualDetail == null) return Collections.emptyMap();
        List<?> individuals = jsonUtil.getNestedValue(individualDetail, List.of("Individual"), List.class);
        if (individuals == null || individuals.isEmpty()) return Collections.emptyMap();
        Map<?, ?> firstIndividual = (Map<?, ?>) individuals.get(0);
        List<?> addresses = jsonUtil.getNestedValue(firstIndividual, List.of("address"), List.class);
        if (addresses == null || addresses.isEmpty()) return Collections.emptyMap();
        Map<?, ?> address = (Map<?, ?>) addresses.get(0);

        String pincode = jsonUtil.getNestedValue(address, List.of("pincode"), String.class);
        String addressLine2 = jsonUtil.getNestedValue(address, List.of("addressLine2"), String.class);
        String city = jsonUtil.getNestedValue(address, List.of("city"), String.class);
        String addressLine1 = jsonUtil.getNestedValue(address, List.of("addressLine1"), String.class);
        String locality = jsonUtil.getNestedValue(address, List.of("address"), String.class);
        String longitude = jsonUtil.getNestedValue(address, List.of("longitude"), String.class);
        String latitude = jsonUtil.getNestedValue(address, List.of("latitude"), String.class);

        Map<String, Object> coordinate = new HashMap<>();
        coordinate.put("longitude", longitude);
        coordinate.put("latitude", latitude);

        Map<String, Object> complainantAddress = new HashMap<>();
        complainantAddress.put("pincode", pincode);
        complainantAddress.put("district", addressLine2);
        complainantAddress.put("city", city);
        complainantAddress.put("state", addressLine1);
        complainantAddress.put("coordinate", coordinate);
        complainantAddress.put("locality", locality);
        return complainantAddress;
    }

    /**
     * Robustly extracts respondent info from courtCase.caseDetails.additionalDetails.respondentDetails.formdata[0].data
     * JS equivalent:
     * name: caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.respondentFirstName || "",
     * address: caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.addressDetails?.[0]?.addressDetails,
     * phone: caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.phonenumbers?.mobileNumber?.[0] || "",
     * email: caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.emails?.emailId?.[0] || "",
     * age: caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.respondentAge,
     * gender: ""
     */
    public RespondentDetails getCaseRespondentFromCourtCase(CourtCase courtCase) {
        if (courtCase == null) return null;
        Object caseDetailsObj = courtCase.getCaseDetails();
        Map<?, ?> additional = jsonUtil.getNestedValue(caseDetailsObj, List.of("additionalDetails"), Map.class);
        if (additional == null) return null;
        Map<?, ?> respondentDetails = jsonUtil.getNestedValue(additional, List.of("respondentDetails"), Map.class);
        if (respondentDetails == null) return null;
        List<?> formdataList = jsonUtil.getNestedValue(respondentDetails, List.of("formdata"), List.class);
        if (formdataList == null || formdataList.isEmpty()) return null;
        Map<?, ?> data = jsonUtil.getNestedValue((Map<?, ?>) formdataList.get(0), List.of("data"), Map.class);
        if (data == null) return null;

        // name
        String name = jsonUtil.getNestedValue(data, List.of("respondentFirstName"), String.class);

        // address
        Address address = null;
        List<?> addressDetailsList = jsonUtil.getNestedValue(data, List.of("addressDetails"), List.class);
        if (addressDetailsList != null && !addressDetailsList.isEmpty()) {
            Map<?, ?> addressMap = jsonUtil.getNestedValue((Map<?, ?>) addressDetailsList.get(0), List.of("addressDetails"), Map.class);
            if (addressMap != null) {
                address = Address.builder()
                        .locality((String) addressMap.getOrDefault("locality", null))
                        .city((String) addressMap.getOrDefault("city", null))
                        .state((String) addressMap.getOrDefault("state", null))
                        .district((String) addressMap.getOrDefault("district", null))
                        .pinCode((String) addressMap.getOrDefault("pincode", null))
//                        .latitude((String) addressMap.getOrDefault("latitude", null))
//                        .longitude((String) addressMap.getOrDefault("longitude", null))
                        .build();
            }
        }

        // phone
        String phone = "";
        Map<?, ?> phonenumbers = jsonUtil.getNestedValue(data, List.of("phonenumbers"), Map.class);
        if (phonenumbers != null) {
            List<?> mobileNumbers = jsonUtil.getNestedValue(phonenumbers, List.of("mobileNumber"), List.class);
            if (mobileNumbers != null && !mobileNumbers.isEmpty()) {
                Object firstMobile = mobileNumbers.get(0);
                phone = firstMobile != null ? firstMobile.toString() : "";
            }
        }

        // email
        String email = "";
        Map<?, ?> emails = jsonUtil.getNestedValue(data, List.of("emails"), Map.class);
        if (emails != null) {
            List<?> emailIds = jsonUtil.getNestedValue(emails, List.of("emailId"), List.class);
            if (emailIds != null && !emailIds.isEmpty()) {
                Object firstEmail = emailIds.get(0);
                email = firstEmail != null ? firstEmail.toString() : "";
            }
        }

        // age
        Integer age = null;
        Object ageObj = jsonUtil.getNestedValue(data, List.of("respondentAge"), Object.class);
        if (ageObj instanceof Integer) age = (Integer) ageObj;
        else if (ageObj != null) {
            try {
                age = Integer.parseInt(ageObj.toString());
            } catch (Exception ignored) {
            }
        }

        // gender (always empty string as per JS)
        String gender = "";

        return RespondentDetails.builder()
                .name(name != null ? name : "")
                .address(address)
                .phone(phone)
                .email(email)
                .age(age)
                .gender(gender)
                .build();
    }

    /**
     * Extracts delivery channel info as a List of Map with keys: code, type, value.
     * Handles both string and address (Map) value types.
     */
    public List<Map<String, Object>> extractDeliveryChannels(JSONArray deliveryChannelArray) {
        List<Map<String, Object>> result = new ArrayList<>();
        if (deliveryChannelArray == null) return result;
        for (Object obj : deliveryChannelArray) {
            if (!(obj instanceof Map)) continue;
            Map<?, ?> channel = (Map<?, ?>) obj;
            Map<String, Object> entry = new HashMap<>();
            entry.put("code", channel.get("code"));
            entry.put("type", channel.get("type"));
            Object value = channel.get("value");
            // If value is a Map (address or complex), keep as is, else as string
            entry.put("value", value);
            result.add(entry);
        }
        return result;
    }

}
