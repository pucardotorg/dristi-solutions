package digit.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import digit.web.models.TaskRequest;
import digit.web.models.TaskResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@Slf4j
@RequiredArgsConstructor
public class TaskUtil {

    private final RestTemplate restTemplate;
    private final Configuration config;

    public TaskResponse callCreateTask(TaskRequest taskRequest) {
        try {
            String uri = config.getTaskServiceHost() + config.getTaskServiceCreateEndpoint();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<TaskRequest> requestEntity = new HttpEntity<>(taskRequest, headers);

            ResponseEntity<TaskResponse> responseEntity = restTemplate.postForEntity(uri,
                    requestEntity, TaskResponse.class);
            log.info("Response of create task :: {}", requestEntity.getBody());

            return responseEntity.getBody();
        } catch (Exception e) {
            log.error("Error getting response from Task Service", e);
            throw new CustomException("TASK_CREATE_ERROR", "Error getting response from task Service");
        }
    }
//
//    public TaskListResponse searchTask(TaskSearchRequest request) {
//
//        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
//        StringBuilder uri = new StringBuilder(config.getTaskServiceHost()).append(config.getTaskSearchEndpoint());
//        Object response = serviceRequestRepository.fetchResult(uri, request);
//
//        try {
//            JsonNode jsonNode = objectMapper.valueToTree(response);
//            return objectMapper.readValue(jsonNode.toString(), TaskListResponse.class);
//        } catch (HttpClientErrorException e) {
//            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
//            throw new ServiceCallException(e.getResponseBodyAsString());
//        } catch (Exception e) {
//            log.error(SEARCHER_SERVICE_EXCEPTION, e);
//            throw new CustomException(); // add log and code
//        }
//
//    }
//
//    public TaskResponse updateTask(TaskRequest request) {
//
//        objectMapper.configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
//        StringBuilder uri = new StringBuilder(config.getTaskServiceHost()).append(config.getTaskUpdateEndPoint());
//        Object response = serviceRequestRepository.fetchResult(uri, request);
//
//        try {
//            JsonNode jsonNode = objectMapper.valueToTree(response);
//            return objectMapper.readValue(jsonNode.toString(), TaskResponse.class);
//        } catch (HttpClientErrorException e) {
//            log.error(EXTERNAL_SERVICE_EXCEPTION, e);
//            throw new ServiceCallException(e.getResponseBodyAsString());
//        } catch (Exception e) {
//            log.error(SEARCHER_SERVICE_EXCEPTION, e);
//            throw new CustomException(); // add log and code
//        }
//
//    }
//
//
//    public List<TaskRequest> createTaskRequestForSummonWarrantAndNotice(RequestInfo requestInfo, Order order, CourtCase courtCase) {
//
//        Map<String, Map<String, JSONArray>> courtRooms = mdmsUtil.fetchMdmsData(requestInfo, order.getTenantId(), "common-masters", List.of("Court_Rooms"));
//
//        JSONArray courtRoomsArray = courtRooms.get("common-masters").get("Court_Rooms");
//
//        Map<String, Object> courtDetails = getCourtDetails(courtRoomsArray, courtCase);
//        String itemId = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("itemId"), String.class);
//
//        Map<String, Object> additionalDetails = new HashMap<>();
//        if (itemId != null) {
//            additionalDetails.put("itemId", itemId);
//        }
//        List<TaskDetails> taskDetailsList = getTaskDetails(order, courtCase, courtDetails, requestInfo);
//        List<TaskRequest> taskRequestList = new ArrayList<>();
//        taskDetailsList.forEach(taskDetail -> {
//
//                    Task task = Task.builder()
//                            .tenantId(order.getTenantId())
//                            .orderId(order.getId())
//                            .filingNumber(order.getFilingNumber())
//                            .cnrNumber(order.getCnrNumber())
//                            .createdDate(dateUtil.getCurrentTimeInMilis())
//                            .taskType(order.getOrderType())
//                            .caseId(courtCase.getId().toString())
//                            .caseTitle(courtCase.getCaseTitle())
//                            .taskDetails(taskDetail)
//                            .amount(Amount.builder().type("FINE").status("DONE").amount("0").build()) // here amount need to fetch from somewhere
//                            .status("INPROGRESS")
//                            .additionalDetails(additionalDetails) // here new hashmap
//                            .build();
//                    taskRequestList.add(TaskRequest.builder().requestInfo(requestInfo).task(task).build());
//                }
//        );
//
//        return taskRequestList;
//    }
//
//    @SuppressWarnings("unchecked")
//    private Map<String, Object> getCourtDetails(JSONArray courtRoomsArray, CourtCase courtCase) {
//        Map<String, Object> courtDetails = (Map<String, Object>) courtRoomsArray.stream()
//                .filter(obj -> {
//                    if (courtCase == null || !(obj instanceof Map data)) return false;
//                    return courtCase.getCourtId() != null && courtCase.getCourtId().equals(data.get("code"));
//                })
//                .findFirst()
//                .orElseGet(HashMap::new);
//
//        return courtDetails;
//    }
//
//    public String constructFullName(String firstName, String middleName, String lastName) {
//        return Stream.of(firstName, middleName, lastName)
//                .filter(name -> name != null && !name.isEmpty()) // Remove null and empty values
//                .collect(Collectors.joining(" ")) // Join with space
//                .trim();
//    }
//
//    public String getFormattedName(String firstName, String middleName, String lastName, String designation, String partyTypeLabel) {
//        // Build the name parts while filtering out null/empty values
//        String nameParts = Stream.of(firstName, middleName, lastName)
//                .filter(name -> name != null && !name.isEmpty())
//                .collect(Collectors.joining(" "));
//
//        // Handle designation
//        String nameWithDesignation = (designation != null && !designation.isEmpty() && !nameParts.isEmpty())
//                ? nameParts + " - " + designation
//                : (designation != null && !designation.isEmpty()) ? designation : nameParts;
//
//        // Handle party type label
//        return (partyTypeLabel != null && !partyTypeLabel.isEmpty())
//                ? nameWithDesignation + " " + partyTypeLabel
//                : nameWithDesignation;
//    }
//
//
//    public List<TaskDetails> getTaskDetails(Order order, CourtCase courtCase, Map<String, Object> courtDetails, RequestInfo requestInfo) {
//
//        TaskDetails taskDetails = TaskDetails.builder().build();
//        try {
//            getSummonWarrantOrNoticeDetails(order, taskDetails, courtCase);
//            getRespondentDetails(order, taskDetails, courtCase);
//            getWitnessDetails(order, taskDetails, courtCase);
//            getComplainantDetails(order, taskDetails, courtCase);
//            getCaseDetails(order, taskDetails, courtCase, courtDetails);
//            return getDeliveryChannel(order, taskDetails, courtCase, requestInfo);
//        } catch (Exception e) {
//            log.error("Exception in getTaskDetails", e);
//            throw new CustomException();
//        }
//
//    }
//
//    private void getComplainantDetails(Order order, TaskDetails taskDetails, CourtCase courtCase) {
//
//        ComplainantDetails complainantDetails = new ComplainantDetails();
//        Optional<Party> primaryComplainant = courtCase.getLitigants().stream().filter(item -> COMPLAINANT_PRIMARY.equalsIgnoreCase(item.getPartyType())).findFirst(); // TODO: check
//        if (primaryComplainant.isPresent()) {
//            String individualId;
//            individualId = primaryComplainant.get().getIndividualId();
//            Map<String, Object> complainantDetailsFromCourtCase = getComplainantDetailsFromCourtCase(courtCase, individualId);
//
//            Map<String, Object> complainantAddressFromIndividualDetail = getComplainantAddressFromComplainantDetails(complainantDetailsFromCourtCase);
//            String complainantName = getComplainantName(complainantDetailsFromCourtCase);
//            complainantDetails.setAddress(complainantAddressFromIndividualDetail);
//            complainantDetails.setName(complainantName);
//        }
//        taskDetails.setComplainantDetails(complainantDetails);
//
//    }
//
//    private List<TaskDetails> getDeliveryChannel(Order order, TaskDetails taskDetails, CourtCase courtCase, RequestInfo requestInfo) throws JsonProcessingException {
//
//        RespondentDetails respondentDetails = taskDetails.getRespondentDetails();
//
//        String receiverPinCode = respondentDetails.getAddress().getPinCode();
//
//        Object orderFormData = getOrderFormDataByOrderType(order.getAdditionalDetails(), order.getOrderType());
//        Object deliveryChannels = jsonUtil.getNestedValue(orderFormData, List.of("selectedChannels"), Object.class);
//        JSONArray deliveryChannelArray = objectMapper.convertValue(deliveryChannels, JSONArray.class);
//        List<Map<String, Object>> channelMap = extractDeliveryChannels(deliveryChannelArray);
//
//        TaskPaymentCriteria taskPaymentCriteria = TaskPaymentCriteria.builder()
//                .receiverPincode(receiverPinCode)
//                .taskType(order.getOrderType())
//                .tenantId(order.getTenantId()).build();
//
//        List<TaskDetails> taskDetailsList = new ArrayList<>();
//
//        for (Map<String, Object> channel : channelMap) {
//
//            TaskDetails taskDetailsClone = objectMapper.convertValue(taskDetails, TaskDetails.class);
//            String channelType = channel.get("type").toString();
//            String channelValue = channel.get("code").toString();
//
//            taskPaymentCriteria.setChannelId(channelValue);
//
//            TaskPaymentRequest taskPaymentRequest = TaskPaymentRequest.builder()
//                    .requestInfo(requestInfo)
//                    .calculationCriteria(Collections.singletonList(
//                            taskPaymentCriteria
//                    )).build();
//
//            CalculationRes calculationRes = paymentCalculatorUtil.callPaymentCalculator(taskPaymentRequest);
//            Double courtFee = calculationRes.getCalculation().stream()
//                    .flatMap(c -> c.getBreakDown().stream())
//                    .filter(bd -> bd.getCode().equals("COURT_FEE"))
//                    .mapToDouble(BreakDown::getAmount)
//                    .sum();
//
//            DeliveryChannel deliveryChannel = DeliveryChannel.builder()
//                    .channelName(ChannelTypeMap.getStateSlaMap().get(channelType).get("type"))
//                    .channelCode(ChannelTypeMap.getStateSlaMap().get(channelType).get("code"))
//                    .fees(courtFee)
//                    .feesStatus("pending").build();
//            taskDetailsClone.setDeliveryChannel(deliveryChannel);
//
//            updateAddressInRespondentDetails(order.getOrderType(), taskDetailsClone, channel);
//            updateAddressInWitnessDetails(order.getOrderType(), taskDetailsClone, channel);
//            taskDetailsList.add(taskDetailsClone);
//        }
//        return taskDetailsList;
//    }
//
//    private void updateAddressInWitnessDetails(String orderType, TaskDetails taskDetails, Map<String, Object> value) {
//        if (taskDetails.getWitnessDetails() != null) {
//            Address address = taskDetails.getRespondentDetails().getAddress();
//            taskDetails.getWitnessDetails().setAddress(address);
//        }
//    }
//
//    private void updateAddressInRespondentDetails(String orderType, TaskDetails taskDetails, Map<String, Object> channel) throws JsonProcessingException {
//
//        if (WARRANT.equalsIgnoreCase(orderType) || "Via Police".equalsIgnoreCase(channel.get("type").toString()) || Arrays.asList("e-Post", "Registered Post").contains(channel.get("type").toString())) {
//            Object addressObject = channel.get("value");
//            Object insideAddressObject = jsonUtil.getNestedValue(addressObject, List.of("address"), Object.class);
//            Object geoLocationObject = jsonUtil.getNestedValue(addressObject, List.of("geoLocationDetails"), Object.class);
//            String id = jsonUtil.getNestedValue(addressObject, List.of("id"), String.class);
//            Address address = objectMapper.convertValue(objectMapper.writeValueAsString(insideAddressObject), Address.class);
//            GeoLocationDetails geoLocationDetails = objectMapper.convertValue(objectMapper.writeValueAsString(geoLocationObject), GeoLocationDetails.class);
//            address.setGeoLocationDetails(geoLocationDetails);
//            address.setId(id);
//            address.setCoordinate(CoordinateAddress.builder()
//                    .latitude(geoLocationDetails.getLatitude())
//                    .longitude(geoLocationDetails.getLongitude()).build());
//            taskDetails.getRespondentDetails().setAddress(address);
//
//        } else if (channel.get("type") == "SMS" || channel.get("type") == "E-mail") {
//            String phoneNumber = channel.get("type") == "SMS" ? channel.get("value").toString() : null;
//            String emailId = channel.get("type") == "E-mail" ? channel.get("value").toString() : null;
//            taskDetails.getRespondentDetails().setPhone(phoneNumber);
//            taskDetails.getRespondentDetails().setEmail(emailId);
//        }
//
//    }
//
//    private void getCaseDetails(Order order, TaskDetails taskDetails, CourtCase courtCase, Map<String, Object> courtDetails) {
//
//        String hearingDate = jsonUtil.getNestedValue(order.getAdditionalDetails(), Arrays.asList("formdata", "dateForHearing"), String.class);
//        Long hearingDateEpoch = null;
//        if (hearingDate != null) hearingDateEpoch = dateUtil.getEpochFromDateString(hearingDate, "yyyy-MM-dd");
//
//        CaseDetails caseDetails = CaseDetails.builder()
//                .caseTitle(courtCase.getCaseTitle())
//                .caseYear(null)
//                .hearingDate(hearingDateEpoch)
//                .courtName(courtDetails.get("name").toString())
//                .courtAddress(courtDetails.get("address").toString())
//                .courtId(courtDetails.get("code").toString())
//                .hearingNumber(order.getHearingNumber())
//                .judgeName(config.getJudgeName())
//                .build();
//        taskDetails.setCaseDetails(caseDetails);
//    }
//
//    private void getWitnessDetails(Order order, TaskDetails taskDetails, CourtCase courtCase) {
//
//        Object orderFormData = getOrderFormDataByOrderType(order.getAdditionalDetails(), order.getOrderType());
//        String docSubType = jsonUtil.getNestedValue(orderFormData, Arrays.asList("party", "data", "partyType"), String.class);
//        RespondentDetails respondentDetails = null;
//        WitnessDetails witnessDetails = null;
//        if (docSubType != null) {
//            respondentDetails = docSubType.equals("Witness") ? getRespondentAccused(order, courtCase) : null;
//        }
//
//        if (respondentDetails != null) {
//            witnessDetails = WitnessDetails.builder()
//                    .name(respondentDetails.getName())
//                    .phone(respondentDetails.getPhone())
//                    .email(respondentDetails.getEmail())
//                    .address(respondentDetails.getAddress())
//                    .build();
//        }
//
//        taskDetails.setWitnessDetails(witnessDetails);
//    }
//
//    private void getRespondentDetails(Order order, TaskDetails taskDetails, CourtCase courtCase) {
//
//
//        Object orderFormData = getOrderFormDataByOrderType(order.getAdditionalDetails(), order.getOrderType());
//        String docSubType = jsonUtil.getNestedValue(orderFormData, Arrays.asList("party", "data", "partyType"), String.class);
//        RespondentDetails respondentDetails = null;
//
//        if (docSubType != null) {
//            respondentDetails = docSubType.equals("Witness") ? getCaseRespondentFromCourtCase(courtCase) : getRespondentAccused(order, courtCase);
//        }
//
//        taskDetails.setRespondentDetails(respondentDetails);
//
//    }
//
//    private RespondentDetails getRespondentAccused(Order order, CourtCase courtCase) {
//
//        Object orderFormData = getOrderFormDataByOrderType(order.getAdditionalDetails(), order.getOrderType());
//        String respondentName = getRespondentName(order.getAdditionalDetails(), order.getOrderType());
//        List<Address> respondentAddress = getRespondentAddress(order, courtCase);
//        String email = getRespondentEmails(orderFormData).get(0);
//        String phone = getRespondentPhoneNumbers(orderFormData).get(0);
//
//        return RespondentDetails.builder()
//                .name(respondentName)
//                .address(respondentAddress.get(0))
//                .age(null)
//                .email(email)
//                .phone(phone)
//                .gender(null).build();
//    }
//
//    private List<Address> getRespondentAddress(Order order, CourtCase courtCase) {
//        Object additionalDetails = order.getAdditionalDetails();
//        String orderType = order.getOrderType();
//        Object orderFormData = getOrderFormDataByOrderType(additionalDetails, orderType);
//
//        // 2. Try to get addressDetails from orderFormData
//        if (orderFormData instanceof Map) {
//            Object addressDetailsObj = ((Map<?, ?>) orderFormData).get("addressDetails");
//            if (addressDetailsObj instanceof List<?> detailsList) {
//                List<Address> addresses = new ArrayList<>();
//                for (Object data : detailsList) {
//                    if (data instanceof Map) {
//                        Object innerAddress = ((Map<?, ?>) data).get("addressDetails");
//                        if (innerAddress instanceof Map) {
//                            Address addr = objectMapper.convertValue(innerAddress, Address.class);
//                            addresses.add(addr);
//                        } else if (innerAddress instanceof Address) {
//                            addresses.add((Address) innerAddress);
//                        }
//                    }
//                }
//                if (!addresses.isEmpty()) return addresses;
//            }
//        }
//
//        // 3. Try to get respondentNameData address
//        Object respondentNameData = null;
//        if (orderFormData != null) {
//            respondentNameData = jsonUtil.getNestedValue(orderFormData, Arrays.asList("party", "data"), Object.class);
//        }
//        if (respondentNameData instanceof Map) {
//            Object addressObj = ((Map<?, ?>) respondentNameData).get("address");
//            if (addressObj instanceof List<?> addressList) {
//                List<Address> addresses = new ArrayList<>();
//                for (Object addr : addressList) {
//                    if (addr instanceof Map) {
//
//                        String innerAddress = jsonUtil.getNestedValue(addr, Arrays.asList("address"), String.class);
//                        if (innerAddress != null) {
//                            Address address = objectMapper.convertValue(innerAddress, Address.class);
//                            addresses.add(address);
//                        } else {
//                            addresses.add(objectMapper.convertValue(addr, Address.class));
//                        }
//                    } else if (addr instanceof Address) {
//                        addresses.add((Address) addr);
//                    }
//                }
//                if (!addresses.isEmpty()) return addresses;
//            } else if (addressObj instanceof Map) {
//                // Single address object
//                return List.of(objectMapper.convertValue(addressObj, Address.class));
//            } else if (addressObj instanceof Address) {
//                return List.of((Address) addressObj);
//            }
//        }
//
//        // 4. Fallback: caseDetails.additionalDetails.respondentDetails.formdata[0].data.addressDetails
//        Object caseDetailsObj = courtCase.getCaseDetails();
//        if (caseDetailsObj instanceof Map) {
//            Object additional = ((Map<?, ?>) caseDetailsObj).get("additionalDetails");
//            if (additional instanceof Map) {
//                Object respondentDetails = ((Map<?, ?>) additional).get("respondentDetails");
//                if (respondentDetails instanceof Map) {
//                    Object formdata = ((Map<?, ?>) respondentDetails).get("formdata");
//                    if (formdata instanceof List<?> formdataList) {
//                        if (!formdataList.isEmpty()) {
//                            Object dataObj = ((Map<?, ?>) formdataList.get(0)).get("data");
//                            if (dataObj instanceof Map) {
//                                Object addressDetailsObj = ((Map<?, ?>) dataObj).get("addressDetails");
//                                if (addressDetailsObj instanceof List<?> detailsList) {
//                                    List<Address> addresses = new ArrayList<>();
//                                    for (Object data : detailsList) {
//                                        if (data instanceof Map) {
//                                            Object innerAddress = ((Map<?, ?>) data).get("addressDetails");
//                                            if (innerAddress instanceof Map) {
//                                                addresses.add(objectMapper.convertValue(innerAddress, Address.class));
//                                            } else if (innerAddress instanceof Address) {
//                                                addresses.add((Address) innerAddress);
//                                            }
//                                        }
//                                    }
//                                    if (!addresses.isEmpty()) return addresses;
//                                }
//                            }
//                        }
//                    }
//                }
//            }
//        }
//        return Collections.emptyList();
//    }
//
//    private String getRespondentName(Object additionalDetails, String orderType) {
//        Object respondentNameData = null;
//
//        Object orderFormData = getOrderFormDataByOrderType(additionalDetails, orderType);
//        if (orderFormData != null) {
//            respondentNameData = jsonUtil.getNestedValue(orderFormData, Arrays.asList("party", "data"), Object.class);
//        }
//
//        if (respondentNameData == null) {
//            return null;
//        }
//
//        boolean isWitness = ((Map<String, Object>) respondentNameData).getOrDefault("partyType", "").toString().equalsIgnoreCase("witness");
//        String partyName = isWitness
//                ? getFormattedName(
//                (String) ((Map<String, Object>) respondentNameData).get("firstName"),
//                (String) ((Map<String, Object>) respondentNameData).get("middleName"),
//                (String) ((Map<String, Object>) respondentNameData).get("lastName"),
//                (String) ((Map<String, Object>) respondentNameData).get("witnessDesignation"),
//                null)
//                : constructFullName(
//                (String) ((Map<String, Object>) respondentNameData).get("firstName"),
//                (String) ((Map<String, Object>) respondentNameData).get("middleName"),
//                (String) ((Map<String, Object>) respondentNameData).get("lastName"));
//
//        if (((Map<String, Object>) respondentNameData).get("respondentCompanyName") != null) {
//            return String.format("%s (Represented By %s)", ((Map<String, Object>) respondentNameData).get("respondentCompanyName"), partyName);
//        }
//        return partyName != null ? partyName : String.valueOf(respondentNameData);
//    }
//
//    private void getSummonWarrantOrNoticeDetails(Order order, TaskDetails taskDetails, CourtCase courtCase) {
//
//        String orderType = order.getOrderType();
//
//        Object orderFormValue = jsonUtil.getNestedValue(order.getAdditionalDetails(), List.of("formdata"), Object.class);
//        Object orderFormData = getOrderFormDataByOrderType(order.getAdditionalDetails(), orderType);
//
//
//        switch (orderType) {
//            case "SUMMONS" -> {
//
//                String docSubType = jsonUtil.getNestedValue(orderFormData, Arrays.asList("party", "data", "partyType"), String.class);
//                if (docSubType != null) {
//                    docSubType = docSubType.equals("Witness") ? "WITNESS" : "ACCUSED";
//                }
//
//                SummonsDetails summonsDetails = SummonsDetails.builder()
//                        .docSubType(docSubType)
//                        .caseFilingDate(courtCase.getFilingDate())
//                        .issueDate(order.getAuditDetails().getLastModifiedTime()).build();
//                taskDetails.setSummonDetails(summonsDetails);
//            }
//            case "WARRANT" -> {
//
//                String docType = jsonUtil.getNestedValue(orderFormValue, Arrays.asList("warrantType", "code"), String.class);
//                Boolean isBailable = jsonUtil.getNestedValue(orderFormValue, Arrays.asList("bailInfo", "isBailable", "code"), Boolean.class);
//                String docSubType = "NON_BAILABLE";
//                if (isBailable) {
//                    docSubType = "BAILABLE";
//
//                }
//                String surety = jsonUtil.getNestedValue(orderFormValue, Arrays.asList("bailInfo", "noOfSureties", "code"), String.class);
//                Double bailableAmount = jsonUtil.getNestedValue(orderFormValue, Arrays.asList("bailInfo", "bailableAmount"), Double.class);
//                WarrantDetails warrantDetails = WarrantDetails.builder()
//                        .caseFilingDate(courtCase.getFilingDate())
//                        .issueDate(order.getAuditDetails().getLastModifiedTime())
//                        .docType(docType).docSubType(docSubType)
//                        .surety(surety)
//                        .bailableAmount(bailableAmount).build();
//
//                taskDetails.setWarrantDetails(warrantDetails);
//            }
//            case "NOTICE" -> {
//
//                String docSubType = jsonUtil.getNestedValue(orderFormData, Arrays.asList("party", "data", "partyType"), String.class);
//                if (docSubType != null) {
//                    docSubType = docSubType.equals("Witness") ? "WITNESS" : "ACCUSED";
//                }
//
//                String noticeType = jsonUtil.getNestedValue(orderFormValue, Arrays.asList("noticeType", "type"), String.class);
//                String partyType = jsonUtil.getNestedValue(orderFormData, Arrays.asList("party", "data", "partyIndex"), String.class);
//                NoticeDetails noticeDetails = NoticeDetails.builder()
//                        .caseFilingDate(courtCase.getFilingDate())
//                        .issueDate(order.getAuditDetails().getLastModifiedTime())
//                        .noticeType(noticeType)
//                        .docSubType(docSubType)
//                        .partyIndex(partyType)
//                        .build();
//
//                taskDetails.setNoticeDetails(noticeDetails);
//
//            }
//        }
//    }
//
//
//    private Object getOrderFormDataByOrderType(Object additionalDetails, String orderType) {
//        Object orderFormData = null;
//        if (additionalDetails != null) {
//            switch (orderType) {
//                case "SUMMONS" ->
//                        orderFormData = jsonUtil.getNestedValue(additionalDetails, Arrays.asList("formdata", "SummonsOrder"), Object.class);
//                case "WARRANT" ->
//                        orderFormData = jsonUtil.getNestedValue(additionalDetails, Arrays.asList("formdata", "warrantFor"), Object.class);
//                case "NOTICE" ->
//                        orderFormData = jsonUtil.getNestedValue(additionalDetails, Arrays.asList("formdata", "noticeOrder"), Object.class);
//            }
//        }
//        return orderFormData;
//    }
//
//    /**
//     * Safely extracts respondent phone numbers from orderFormData using jsonUtil.
//     * Equivalent to: orderFormData?.party?.data?.phone_numbers || []
//     */
//    @SuppressWarnings("unchecked")
//    public List<String> getRespondentPhoneNumbers(Object orderFormData) {
//        if (orderFormData == null) return Collections.emptyList();
//        Map<?, ?> party = jsonUtil.getNestedValue(orderFormData, List.of("party"), Map.class);
//        if (party == null) return Collections.emptyList();
//        Map<?, ?> data = jsonUtil.getNestedValue(party, List.of("data"), Map.class);
//        if (data == null) return Collections.emptyList();
//        List<String> phoneNumbers = jsonUtil.getNestedValue(data, List.of("phone_numbers"), List.class);
//        return phoneNumbers != null ? phoneNumbers : Collections.emptyList();
//    }
//
//    /**
//     * Safely extracts respondent emails from orderFormData using jsonUtil.
//     * Equivalent to: orderFormData?.party?.data?.email || []
//     */
//    @SuppressWarnings("unchecked")
//    public List<String> getRespondentEmails(Object orderFormData) {
//        if (orderFormData == null) return Collections.emptyList();
//        Map<?, ?> party = jsonUtil.getNestedValue(orderFormData, List.of("party"), Map.class);
//        if (party == null) return Collections.emptyList();
//        Map<?, ?> data = jsonUtil.getNestedValue(party, List.of("data"), Map.class);
//        if (data == null) return Collections.emptyList();
//        List<String> emails = jsonUtil.getNestedValue(data, List.of("email"), List.class);
//        return emails != null ? emails : Collections.emptyList();
//    }
//
//    // Equivalent of getComplainantName in JS
//    public String getComplainantName(Map<String, Object> complainantDetails) {
//        if (complainantDetails == null) return "";
//        String firstName = jsonUtil.getNestedValue(complainantDetails, List.of("firstName"), String.class);
//        String lastName = jsonUtil.getNestedValue(complainantDetails, List.of("lastName"), String.class);
//        String partyName = ((firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "")).trim();
//        Map<?, ?> complainantTypeObj = jsonUtil.getNestedValue(complainantDetails, List.of("complainantType"), Map.class);
//        String complainantTypeCode = complainantTypeObj != null ? (String) complainantTypeObj.get("code") : null;
//        if ("INDIVIDUAL".equalsIgnoreCase(complainantTypeCode)) {
//            return partyName;
//        }
//        String companyName = jsonUtil.getNestedValue(complainantDetails, List.of("complainantCompanyName"), String.class);
//        if (companyName != null && !companyName.isEmpty()) {
//            return String.format("%s (Represented By %s)", companyName, partyName);
//        }
//        return "";
//    }
//
//    public Map<String, Object> getComplainantDetailsFromCourtCase(CourtCase courtCase, String complainantIndividualId) {
//        if (courtCase == null) return Collections.emptyMap();
//        Object additional = courtCase.getAdditionalDetails();
//        Map<?, ?> complainantDetailsObj = jsonUtil.getNestedValue(additional, List.of("complainantDetails"), Map.class);
//        List<?> formdataList = jsonUtil.getNestedValue(complainantDetailsObj, List.of("formdata"), List.class);
//        if (formdataList == null || formdataList.isEmpty()) return Collections.emptyMap();
//        Map complainantDetails = formdataList.stream()
//                .filter(d -> {
//                    Map<?, ?> data = jsonUtil.getNestedValue(d, List.of("data"), Map.class);
//                    Map<?, ?> individualDetails = jsonUtil.getNestedValue(data, List.of("complainantVerification", "individualDetails"), Map.class);
//                    return individualDetails != null && complainantIndividualId.equals(individualDetails.get("individualId"));
//                })
//                .findFirst()
//                .map(d -> jsonUtil.getNestedValue(d, List.of("data"), Map.class))
//                .orElse(Collections.emptyMap());
//
//        return complainantDetails;
//
//    }
//
//    /**
//     * Extracts complainant address fields from individualDetail JsonObject structure, returns as Map<String, Object>.
//     * Mirrors the JS logic for complainantAddress.
//     */
//    public Map<String, Object> getComplainantAddressFromComplainantDetails(Map<String, Object> complainantDetails) {
//        if (complainantDetails == null) return Collections.emptyMap();
//
//        String district = jsonUtil.getNestedValue(complainantDetails, List.of("addressDetails", "district"), String.class);
//        String city = jsonUtil.getNestedValue(complainantDetails, List.of("addressDetails", "city"), String.class);
//        String pincode = jsonUtil.getNestedValue(complainantDetails, List.of("addressDetails", "pincode"), String.class);
//        String latitude = jsonUtil.getNestedValue(complainantDetails, List.of("addressDetails", "pincode", "latitude"), String.class);
//        String longitude = jsonUtil.getNestedValue(complainantDetails, List.of("addressDetails", "pincode", "longitude"), String.class);
//        String locality = jsonUtil.getNestedValue(complainantDetails, List.of("addressDetails", "locality"), String.class);
//        String state = jsonUtil.getNestedValue(complainantDetails, List.of("addressDetails", "state"), String.class);
//
//        Map<String, Object> coordinate = new HashMap<>();
//        coordinate.put("longitude", longitude);
//        coordinate.put("latitude", latitude);
//
//        Map<String, Object> complainantAddress = new HashMap<>();
//        complainantAddress.put("pincode", pincode);
//        complainantAddress.put("district", district);
//        complainantAddress.put("city", city);
//        complainantAddress.put("state", state);
//        complainantAddress.put("coordinate", coordinate);
//        complainantAddress.put("locality", locality);
//        return complainantAddress;
//    }
//
//    /**
//     * Robustly extracts respondent info from courtCase.caseDetails.additionalDetails.respondentDetails.formdata[0].data
//     * JS equivalent:
//     * name: caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.respondentFirstName || "",
//     * address: caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.addressDetails?.[0]?.addressDetails,
//     * phone: caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.phonenumbers?.mobileNumber?.[0] || "",
//     * email: caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.emails?.emailId?.[0] || "",
//     * age: caseDetails?.additionalDetails?.respondentDetails?.formdata?.[0]?.data?.respondentAge,
//     * gender: ""
//     */
//    public RespondentDetails getCaseRespondentFromCourtCase(CourtCase courtCase) {
//        if (courtCase == null) return null;
//        Object caseDetailsObj = courtCase.getCaseDetails();
//        Map<?, ?> additional = jsonUtil.getNestedValue(caseDetailsObj, List.of("additionalDetails"), Map.class);
//        if (additional == null) return null;
//        Map<?, ?> respondentDetails = jsonUtil.getNestedValue(additional, List.of("respondentDetails"), Map.class);
//        if (respondentDetails == null) return null;
//        List<?> formdataList = jsonUtil.getNestedValue(respondentDetails, List.of("formdata"), List.class);
//        if (formdataList == null || formdataList.isEmpty()) return null;
//        Map<?, ?> data = jsonUtil.getNestedValue(formdataList.get(0), List.of("data"), Map.class);
//        if (data == null) return null;
//
//        // name
//        String name = jsonUtil.getNestedValue(data, List.of("respondentFirstName"), String.class);
//
//        // address
//        Address address = null;
//        List<?> addressDetailsList = jsonUtil.getNestedValue(data, List.of("addressDetails"), List.class);
//        if (addressDetailsList != null && !addressDetailsList.isEmpty()) {
//            Map<?, ?> addressMap = jsonUtil.getNestedValue(addressDetailsList.get(0), List.of("addressDetails"), Map.class);
//            if (addressMap != null) {
//                address = Address.builder()
//                        .locality((String) addressMap.getOrDefault("locality", null))
//                        .city((String) addressMap.getOrDefault("city", null))
//                        .state((String) addressMap.getOrDefault("state", null))
//                        .district((String) addressMap.getOrDefault("district", null))
//                        .pinCode((String) addressMap.getOrDefault("pincode", null))
////                        .latitude((String) addressMap.getOrDefault("latitude", null))
////                        .longitude((String) addressMap.getOrDefault("longitude", null))
//                        .build();
//            }
//        }
//
//        // phone
//        String phone = "";
//        Map<?, ?> phonenumbers = jsonUtil.getNestedValue(data, List.of("phonenumbers"), Map.class);
//        if (phonenumbers != null) {
//            List<?> mobileNumbers = jsonUtil.getNestedValue(phonenumbers, List.of("mobileNumber"), List.class);
//            if (mobileNumbers != null && !mobileNumbers.isEmpty()) {
//                Object firstMobile = mobileNumbers.get(0);
//                phone = firstMobile != null ? firstMobile.toString() : "";
//            }
//        }
//
//        // email
//        String email = "";
//        Map<?, ?> emails = jsonUtil.getNestedValue(data, List.of("emails"), Map.class);
//        if (emails != null) {
//            List<?> emailIds = jsonUtil.getNestedValue(emails, List.of("emailId"), List.class);
//            if (emailIds != null && !emailIds.isEmpty()) {
//                Object firstEmail = emailIds.get(0);
//                email = firstEmail != null ? firstEmail.toString() : "";
//            }
//        }
//
//        // age
//        Integer age = null;
//        Object ageObj = jsonUtil.getNestedValue(data, List.of("respondentAge"), Object.class);
//        if (ageObj instanceof Integer) age = (Integer) ageObj;
//        else if (ageObj != null) {
//            try {
//                age = Integer.parseInt(ageObj.toString());
//            } catch (Exception ignored) {
//            }
//        }
//
//        // gender (always empty string as per JS)
//        String gender = "";
//
//        return RespondentDetails.builder()
//                .name(name != null ? name : "")
//                .address(address)
//                .phone(phone)
//                .email(email)
//                .age(age)
//                .gender(gender)
//                .build();
//    }
//
//    /**
//     * Extracts delivery channel info as a List of Map with keys: code, type, value.
//     * Handles both string and address (Map) value types.
//     */
//    public List<Map<String, Object>> extractDeliveryChannels(JSONArray deliveryChannelArray) {
//        List<Map<String, Object>> result = new ArrayList<>();
//        if (deliveryChannelArray == null) return result;
//        for (Object obj : deliveryChannelArray) {
//            if (!(obj instanceof Map<?, ?> channel)) continue;
//            Map<String, Object> entry = new HashMap<>();
//            entry.put("code", channel.get("code"));
//            entry.put("type", channel.get("type"));
//            Object value = channel.get("value");
//            // If value is a Map (address or complex), keep as is, else as string
//            entry.put("value", value);
//            result.add(entry);
//        }
//        return result;
//    }
//
//
//    public void enrichTaskWorkflow(String channel, Order order, TaskRequest taskRequest) {
//        WorkflowObject workflowObject = new WorkflowObject();
//        if (EMAIL.equalsIgnoreCase(channel) || SMS.equalsIgnoreCase(channel)) {
//            workflowObject.setAction("CREATE_WITH_OUT_PAYMENT");
//        } else {
//            workflowObject.setAction("CREATE");
//        }
//        workflowObject.setComments(order.getOrderType());
//        workflowObject.setDocuments(Collections.singletonList(Document.builder().build()));
//
//        taskRequest.getTask().setWorkflow(workflowObject);
//    }
//
}