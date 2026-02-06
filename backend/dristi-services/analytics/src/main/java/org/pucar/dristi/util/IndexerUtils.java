package org.pucar.dristi.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.common.models.individual.Individual;
import org.egov.tracer.model.CustomException;
import org.json.JSONArray;
import org.json.JSONObject;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.config.MdmsDataConfig;
import org.pucar.dristi.kafka.consumer.EventConsumerConfig;
import org.pucar.dristi.service.IndividualService;
import org.pucar.dristi.service.SmsNotificationService;
import org.pucar.dristi.service.UserService;
import org.pucar.dristi.web.models.*;
import org.pucar.dristi.web.models.casemodels.CaseAdvocateOffice;
import org.pucar.dristi.web.models.taskManagement.TaskManagement;
import org.pucar.dristi.web.models.taskManagement.TaskSearchCriteria;
import org.pucar.dristi.web.models.taskManagement.TaskSearchRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import static org.pucar.dristi.config.ServiceConstants.*;

@Service
@Slf4j
public class IndexerUtils {

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    private final RestTemplate restTemplate;

    private final Configuration config;

    private final CaseUtil caseUtil;

    private final EvidenceUtil evidenceUtil;

    private final TaskUtil taskUtil;

    private final ApplicationUtil applicationUtil;

    private final ObjectMapper mapper;

    private final MdmsDataConfig mdmsDataConfig;

    private final CaseOverallStatusUtil caseOverallStatusUtil;

    private final SmsNotificationService notificationService;

    private final IndividualService individualService;

    private final AdvocateUtil advocateUtil;

    private final Clock clock;

    private final UserService userService;

    private final JsonUtil jsonUtil;

    private final TaskManagementUtil taskManagementUtil;


    @Autowired
    public IndexerUtils(RestTemplate restTemplate, Configuration config, CaseUtil caseUtil, EvidenceUtil evidenceUtil, TaskUtil taskUtil, ApplicationUtil applicationUtil, ObjectMapper mapper, MdmsDataConfig mdmsDataConfig, CaseOverallStatusUtil caseOverallStatusUtil, SmsNotificationService notificationService, IndividualService individualService, AdvocateUtil advocateUtil, Clock clock, UserService userService, JsonUtil jsonUtil, TaskManagementUtil taskManagementUtil) {
        this.restTemplate = restTemplate;
        this.config = config;
        this.caseUtil = caseUtil;
        this.evidenceUtil = evidenceUtil;
        this.taskUtil = taskUtil;
        this.applicationUtil = applicationUtil;
        this.mapper = mapper;
        this.mdmsDataConfig = mdmsDataConfig;
        this.caseOverallStatusUtil = caseOverallStatusUtil;
        this.notificationService = notificationService;
        this.individualService = individualService;
        this.advocateUtil = advocateUtil;
        this.clock = clock;
        this.userService = userService;
        this.jsonUtil = jsonUtil;
        this.taskManagementUtil = taskManagementUtil;
    }

    public static boolean isNullOrEmpty(String str) {
        return str == null || str.trim().isEmpty();
    }

    /**
     * A Poll thread that polls es for its status and keeps the kafka container
     * paused until ES is back up. Once ES is up, container is resumed and all the
     * stacked up records in the queue are processed.
     */
    public void orchestrateListenerOnESHealth() {
        EventConsumerConfig.pauseContainer();
        log.info("Polling ES....");
        final Runnable esPoller = new Runnable() {
            boolean threadRun = true;

            public void run() {
                if (threadRun) {
                    Object response = null;
                    try {
                        String url = config.getEsHostUrl() + "/_search";
                        final HttpHeaders headers = new HttpHeaders();
                        headers.add("Authorization", getESEncodedCredentials());
                        final HttpEntity entity = new HttpEntity(headers);
                        response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
                    } catch (Exception e) {
                        log.error("ES is DOWN..");
                    }
                    if (response != null) {
                        log.info("ES is UP!");
                        EventConsumerConfig.resumeContainer();
                        threadRun = false;
                    }
                }
            }
        };
        scheduler.scheduleAtFixedRate(esPoller, 0, Long.parseLong(config.getPollInterval()), TimeUnit.SECONDS);
    }

    public String buildString(Object object) {
        // JsonPath cannot be applied on the type JSONObject. String has to be built of
        // it and then used.
        String[] array = object.toString().split(":");
        StringBuilder jsonArray = new StringBuilder();
        for (int i = 0; i < array.length; i++) {
            jsonArray.append(array[i]);
            if (i != array.length - 1)
                jsonArray.append(":");
        }
        return jsonArray.toString();
    }

    public String getESEncodedCredentials() {
        String credentials = config.getEsUsername() + ":" + config.getEsPassword();
        byte[] credentialsBytes = credentials.getBytes();
        byte[] base64CredentialsBytes = Base64.getEncoder().encode(credentialsBytes);
        return "Basic " + new String(base64CredentialsBytes);
    }

    public String buildPayload(PendingTask pendingTask) {

        String id = pendingTask.getId();
        String name = pendingTask.getName();
        String entityType = pendingTask.getEntityType();
        String referenceId = pendingTask.getReferenceId();
        String status = pendingTask.getStatus();
        Long stateSla = pendingTask.getStateSla();
        Long businessServiceSla = pendingTask.getBusinessServiceSla();
        List<User> assignedToList = pendingTask.getAssignedTo();
        List<String> assignedRoleList = pendingTask.getAssignedRole();
        String assignedTo = new JSONArray(assignedToList).toString();
        String assignedRole = new JSONArray(assignedRoleList).toString();
        Boolean isCompleted = pendingTask.getIsCompleted();
        String cnrNumber = pendingTask.getCnrNumber();
        String filingNumber = pendingTask.getFilingNumber();
        String caseId = pendingTask.getCaseId();
        String caseTitle = pendingTask.getCaseTitle();
        String additionalDetails = "{}";
        String screenType = pendingTask.getScreenType();
        String caseNumber = filingNumber;
        String actionCategory = pendingTask.getActionCategory();
        Long filingDate = pendingTask.getFilingDate();
        String sectionAndSubSection = pendingTask.getSectionAndSubSection();
        String referenceEntityType = pendingTask.getReferenceEntityType();


        String courtId = null;
        String caseSubStage = null;
        String advocateDetails = "{}";
        String searchableFields = null;
        String offices = "[]";
        if (filingNumber != null) {
            JsonNode caseDetails = getCaseDetails(filingNumber, caseId);

            courtId = caseDetails.get(0).path("courtId").textValue();

            String cmpNumber = caseDetails.get(0).path("cmpNumber").textValue();
            String courtCaseNumber = caseDetails.get(0).path("courtCaseNumber").textValue();
            caseSubStage = caseDetails.get(0).path("substage").textValue();

            if (courtCaseNumber != null && !courtCaseNumber.isEmpty()) {
                caseNumber = courtCaseNumber;
            } else if (cmpNumber != null && !cmpNumber.isEmpty()) {
                caseNumber = cmpNumber;
            }

            JsonNode representativesNode = caseUtil.getRepresentatives(caseDetails);
            List<AdvocateMapping> representatives = mapper.convertValue(representativesNode, new TypeReference<List<AdvocateMapping>>() {
            });

            AdvocateDetail advocate = getAdvocates(representatives);

            try {
                advocateDetails = mapper.writeValueAsString(advocate);
            } catch (Exception e) {
                log.error("Error while building advocate details json", e);
                throw new CustomException(Pending_Task_Exception, "Error while building advocate details json: " + e);
            }

            List<String> searchableFieldsList = new ArrayList<>();
            searchableFieldsList.add(filingNumber);
            if (!filingNumber.equals(caseNumber)) {
                searchableFieldsList.add(caseNumber);
            }
            searchableFieldsList.add(caseTitle);
            searchableFieldsList.addAll(advocate.getAccused());
            searchableFieldsList.addAll(advocate.getComplainant());

            searchableFields = new JSONArray(searchableFieldsList).toString();

            // Enrich offices from case details based on assignedTo
            if (assignedToList != null && !assignedToList.isEmpty()) {
                offices = (pendingTask.getOffices() != null && !pendingTask.getOffices().isEmpty()) ? new JSONArray(pendingTask.getOffices()).toString() : enrichOfficesFromCaseDetails(caseDetails, assignedToList);
            } else {
                log.error("assignedToList is null or empty while enriching offices from case details during manual pending task creation");
            }
        }

        Long createdTime = clock.millis();

        Long expiryTime = pendingTask.getExpiryDate();
        try {
            additionalDetails = mapper.writeValueAsString(pendingTask.getAdditionalDetails());
        } catch (Exception e) {
            log.error("Error while building API payload", e);
            throw new CustomException(Pending_Task_Exception, "Error occurred while preparing pending task: " + e);
        }


        return String.format(
                ES_INDEX_HEADER_FORMAT + ES_INDEX_DOCUMENT_FORMAT,
                config.getIndex(), referenceId, id, name, entityType, referenceId, status, caseNumber, caseSubStage, advocateDetails, actionCategory, searchableFields, assignedTo, assignedRole, cnrNumber, filingNumber, caseId, caseTitle, isCompleted, stateSla, businessServiceSla, additionalDetails, screenType, courtId, createdTime, expiryTime, sectionAndSubSection, filingDate, referenceEntityType, offices, null, null
        );
    }

    private String enrichOfficesFromCaseDetails(JsonNode caseDetails, List<User> assignedToList) {
        try {
            List<org.pucar.dristi.web.models.casemodels.CaseAdvocateOffice> advocateOffices = caseUtil.getAdvocateOffices(caseDetails);
            if (advocateOffices == null || advocateOffices.isEmpty()) {
                return "[]";
            }

            Set<String> assignedUuids = assignedToList.stream()
                    .map(User::getUuid)
                    .filter(Objects::nonNull)
                    .collect(java.util.stream.Collectors.toSet());

            return getOfficesStringFromList(advocateOffices, assignedUuids);
        } catch (Exception e) {
            log.error("Error while enriching offices from case details", e);
            return "[]";
        }
    }

    private JsonNode getCaseDetails(String filingNumber, String caseId) {
        try {
            RequestInfo requestInfo = createInternalRequestInfo();
            requestInfo.getUserInfo().setType("EMPLOYEE");
            CaseSearchRequest caseSearchRequest = createCaseSearchRequest(requestInfo, filingNumber, caseId);
            return caseUtil.searchCaseDetails(caseSearchRequest);
        } catch (Exception e) {
            log.error("Error occurred while getting case details for filingNumber :: {}", filingNumber);
        }
        return null;
    }

    private RequestInfo createInternalRequestInfo() {
        User userInfo = new User();
        userInfo.setUuid(userService.internalMicroserviceRoleUuid);
        userInfo.setRoles(userService.internalMicroserviceRoles);
        userInfo.setTenantId(config.getEgovStateTenantId());
        return RequestInfo.builder().userInfo(userInfo).msgId(msgId).build();
    }

    public String buildPayload(String jsonItem, JSONObject requestInfo) throws JsonProcessingException {

        String id = JsonPath.read(jsonItem, ID_PATH);
        String entityType = JsonPath.read(jsonItem, BUSINESS_SERVICE_PATH);
        String referenceId = JsonPath.read(jsonItem, BUSINESS_ID_PATH);
        String status = JsonPath.read(jsonItem, STATE_PATH);
        Object stateSlaObj = JsonPath.read(jsonItem, STATE_SLA_PATH);
        Long stateSla = stateSlaObj != null ? ((Number) stateSlaObj).longValue() : null;
        Object businessServiceSlaObj = JsonPath.read(jsonItem, BUSINESS_SERVICE_SLA_PATH);
        Long businessServiceSla = businessServiceSlaObj != null ? ((Number) businessServiceSlaObj).longValue() : null;
        List<Object> assignedToList = JsonPath.read(jsonItem, ASSIGNES_PATH);
        List<String> assignedRoleList = JsonPath.read(jsonItem, ASSIGNED_ROLE_PATH);
        List<Object> defaultRoles = null;
        String assignedTo = new JSONArray(assignedToList).toString();
        String tenantId = JsonPath.read(jsonItem, TENANT_ID_PATH);
        String action = JsonPath.read(jsonItem, ACTION_PATH);
        boolean isCompleted;
        boolean isGeneric;

        stateSla = getSla(stateSla);

        log.info("Inside indexer utils build payload:: entityType: {}, referenceId: {}, status: {}, action: {}, tenantId: {}", entityType, referenceId, status, action, tenantId);
        Object object = caseOverallStatusUtil.checkCaseOverAllStatus(entityType, referenceId, status, action, tenantId, requestInfo);
        Map<String, String> details = processEntity(entityType, referenceId, status, action, object, requestInfo);

        // Validate details map using the utility function
        String cnrNumber = details.get("cnrNumber");
        String filingNumber = details.get("filingNumber");
        String caseId = details.get("caseId");
        String caseTitle = details.get("caseTitle");
        String nextHearingDate = details.get("nextHearingDate");
        String dateOfApplication = details.get("dateOfApplication");
        String screenType = details.get("screenType");
        String name = details.get("name");
        isCompleted = isNullOrEmpty(name);
        isGeneric = details.containsKey("isGeneric");
        String actors = details.get("actors");
        String actionCategory = details.get("actionCategory");
        String referenceEntityType = details.get("referenceEntityType");
        Long stateSlaFromMdms = details.get("stateSla") != null ? Long.parseLong(details.get("stateSla")) : null;
        if (stateSlaFromMdms != null) {
            stateSla = stateSlaFromMdms + clock.millis();
        }

        if (details.get("defaultRoles") != null && !details.get("defaultRoles").isEmpty()) {
            String defaultRolesString = details.get("defaultRoles");
            defaultRoles = new JSONArray(defaultRolesString).toList();

            if (defaultRoles != null) {
                for (Object roleObj : defaultRoles) {
                    String role = String.valueOf(roleObj);
                    assignedRoleList.add(role);
                }
            }
        }
        Set<String> assignedRoleSet = new HashSet<>(assignedRoleList);
        String assignedRole = new JSONArray(assignedRoleSet).toString();

        RequestInfo requestInfo1 = mapper.readValue(requestInfo.toString(), RequestInfo.class);
        Long createdTime = clock.millis();
        Long filingDate = details.get("filingDate") != null ? Long.parseLong(details.get("filingDate")) : null;
        String sectionAndSubSection = details.get("sectionAndSubSection");

        JsonNode caseDetails = null;

        if (isGeneric) {
            log.info("creating pending task from generic task");
            Object task = taskUtil.getTask(requestInfo, tenantId, null, referenceId, status);
            net.minidev.json.JSONArray assignToList = JsonPath.read(task.toString(), ASSIGN_TO_PATH);
            assignedTo = assignToList.toString();
            Object dueDate = JsonPath.read(task.toString(), DUE_DATE_PATH);
            stateSla = dueDate != null ? ((Number) dueDate).longValue() : null;
            assignedRole = new JSONArray().toString();
        }
        if (!isCompleted) {
            try {
                if (actors.toLowerCase().contains(ADVOCATE) || actors.toLowerCase().contains(LITIGANT)) {
                    String jsonString = requestInfo.toString();
                    RequestInfo request = mapper.readValue(jsonString, RequestInfo.class);
                    CaseSearchRequest caseSearchRequest = createCaseSearchRequest(request, filingNumber, caseId);
                    caseDetails = caseUtil.searchCaseDetails(caseSearchRequest);
                    JsonNode litigants = caseUtil.getLitigants(caseDetails);
                    Set<String> individualIds = caseUtil.getIndividualIds(litigants);
                    JsonNode representatives = caseUtil.getRepresentatives(caseDetails);
                    Set<String> representativeIds = caseUtil.getAdvocateIds(representatives);
                    Set<String> powerOfAttorneyIds = caseUtil.extractPowerOfAttorneyIds(caseDetails, individualIds);
                    if (!powerOfAttorneyIds.isEmpty()) {
                        individualIds.addAll(powerOfAttorneyIds);
                    }

                    if (!representativeIds.isEmpty()) {
                        representativeIds = advocateUtil.getAdvocate(request, representativeIds.stream().toList());
                    }
                    individualIds.addAll(representativeIds);
                    SmsTemplateData smsTemplateData = enrichSmsTemplateData(details, tenantId);
                    List<String> phonenumbers = callIndividualService(request, new ArrayList<>(individualIds));
                    for (String number : phonenumbers) {
                        notificationService.sendNotification(request, smsTemplateData, PENDING_TASK_CREATED, number);
                    }
                }
            } catch (Exception e) {
                // Log the exception and continue the execution without throwing
                log.error("Error occurred while sending notification: {}", e.toString());
            }
        }

        log.info("case details :: {}, for filingNumber: {}", caseDetails, filingNumber);
        String courtId = null;
        String caseSubStage = null;
        String advocateDetails = "{}";
        String searchableFields = null;
        String caseNumber = filingNumber;
        String offices = "[]";

        if (caseDetails == null && filingNumber != null) {
            requestInfo1.getUserInfo().setType("EMPLOYEE");
            CaseSearchRequest caseSearchRequest = createCaseSearchRequest(requestInfo1, filingNumber, caseId);
            caseDetails = caseUtil.searchCaseDetails(caseSearchRequest);
        }
        if (caseDetails != null) {
            courtId = caseDetails.get(0).path("courtId").textValue();

            String cmpNumber = caseDetails.get(0).path("cmpNumber").textValue();
            String courtCaseNumber = caseDetails.get(0).path("courtCaseNumber").textValue();
            caseSubStage = caseDetails.get(0).path("substage").textValue();

            if (courtCaseNumber != null && !courtCaseNumber.isEmpty()) {
                caseNumber = courtCaseNumber;
            } else if (cmpNumber != null && !cmpNumber.isEmpty()) {
                caseNumber = cmpNumber;
            }

            JsonNode representativesNode = caseUtil.getRepresentatives(caseDetails);
            List<AdvocateMapping> representatives = mapper.convertValue(representativesNode, new TypeReference<List<AdvocateMapping>>() {
            });

            AdvocateDetail advocate = getAdvocates(representatives);

            try {
                advocateDetails = mapper.writeValueAsString(advocate);
            } catch (Exception e) {
                log.error("Error while building advocate details json", e);
                throw new CustomException(Pending_Task_Exception, "Error while building advocate details json: " + e);
            }

            List<String> searchableFieldsList = new ArrayList<>();
            if (caseNumber != null && !Objects.equals(caseNumber, filingNumber)) {
                searchableFieldsList.add(caseNumber);
            }
            searchableFieldsList.add(filingNumber);
            searchableFieldsList.add(caseTitle);
            if(nextHearingDate!=null)
             searchableFieldsList.add(nextHearingDate);
            if(dateOfApplication!=null)
             searchableFieldsList.add(dateOfApplication);
            searchableFieldsList.addAll(advocate.getAccused());
            searchableFieldsList.addAll(advocate.getComplainant());

             searchableFields = new JSONArray(searchableFieldsList).toString();
            log.info("searchableFields: {}", searchableFields);

            // Enrich offices from case details based on assignedTo
            if (assignedToList != null && !assignedToList.isEmpty()) {
                offices = enrichOfficesFromCaseDetailsWithObjectList(caseDetails, assignedToList);
            } else {
                log.error("assignedToList is null or empty while enriching offices from case details during workflow driven pending task creation");
            }
        }

        Object additionalDetails;
        try {
            additionalDetails = JsonPath.read(jsonItem, "additionalDetails");
            if (additionalDetails != null) {
                additionalDetails = mapper.writeValueAsString(additionalDetails);
            } else {
                additionalDetails = "{}";
            }
            JsonNode additonalDetailsJsonNode = mapper.readTree(additionalDetails.toString());
            if (additonalDetailsJsonNode != null && additonalDetailsJsonNode.has("excludeRoles")) {
                log.info("additional details contains exclude roles");
                JsonNode excludeRoles = additonalDetailsJsonNode.path("excludeRoles");
                if (excludeRoles.isArray()) {
                    List<String> excludeRolesList = new ArrayList<>();
                    if (excludeRoles.isArray()) {
                        for (JsonNode node : excludeRoles) {
                            excludeRolesList.add(node.asText());  // Extract string values
                        }
                    }
                    log.info("removing roles from assignedRoleList : {} ", excludeRolesList);
                    excludeRolesList.forEach(assignedRoleSet::remove);
                    assignedRole = new JSONArray(assignedRoleSet).toString();
                }
            }
            if (additonalDetailsJsonNode != null && additonalDetailsJsonNode.has(EXCLUDED_ASSIGNED_UUIDS)) {
                log.info("additional details contains uuid's to exclude");
                JsonNode excludedAssignedUuids = additonalDetailsJsonNode.path(EXCLUDED_ASSIGNED_UUIDS);
                if (excludedAssignedUuids.isArray()) {
                    List<String> excludedAssignedUuidsList = new ArrayList<>();
                    for (JsonNode node : excludedAssignedUuids) {
                        excludedAssignedUuidsList.add(node.asText());
                    }
                    log.info("removing roles from assignedUuidList : {} ", excludedAssignedUuidsList);
                    assignedToList = new ArrayList<>(assignedToList);
                    assignedToList.removeIf(userObj -> {
                        if (userObj instanceof Map) {
                            Object uuidObj = ((Map<?, ?>) userObj).get("uuid");
                            return excludedAssignedUuidsList.contains(String.valueOf(uuidObj));
                        }
                        return false; // If not a map, do not remove
                    });
                    assignedTo = new JSONArray(assignedToList).toString();
                }
            }
            if(additonalDetailsJsonNode != null && additonalDetailsJsonNode.has("dueDate")) {
                stateSla = additonalDetailsJsonNode.get("dueDate").asLong();
            }
        } catch (Exception e) {
            log.error("Error while building listener payload");
            throw new CustomException(Pending_Task_Exception, "Error occurred while preparing pending task: " + e);
        }

        return String.format(
                ES_INDEX_HEADER_FORMAT + ES_INDEX_DOCUMENT_FORMAT,
                config.getIndex(), referenceId, id, name, entityType, referenceId, status, caseNumber, caseSubStage, advocateDetails, actionCategory, searchableFields, assignedTo, assignedRole, cnrNumber, filingNumber, caseId, caseTitle, isCompleted, stateSla, businessServiceSla, additionalDetails, screenType, courtId, createdTime, null, sectionAndSubSection, filingDate, referenceEntityType, offices, dateOfApplication, nextHearingDate
        );
    }

    private String enrichOfficesFromCaseDetailsWithObjectList(JsonNode caseDetails, List<Object> assignedToList) {
        try {
            List<org.pucar.dristi.web.models.casemodels.CaseAdvocateOffice> advocateOffices = caseUtil.getAdvocateOffices(caseDetails);
            if (advocateOffices == null || advocateOffices.isEmpty()) {
                return "[]";
            }

            Set<String> assignedUuids = new HashSet<>();
            for (Object obj : assignedToList) {
                if (obj instanceof Map) {
                    Object uuidObj = ((Map<?, ?>) obj).get("uuid");
                    if (uuidObj != null) {
                        assignedUuids.add(String.valueOf(uuidObj));
                    }
                }
            }

            return getOfficesStringFromList(advocateOffices, assignedUuids);
        } catch (Exception e) {
            log.error("Error while enriching offices from case details with object list", e);
            return "[]";
        }
    }

    private String getOfficesStringFromList(List<org.pucar.dristi.web.models.casemodels.CaseAdvocateOffice> advocateOffices, Set<String> assignedUuids) throws JsonProcessingException {
        List<AdvocateOffice> officesList = new ArrayList<>();

        for (org.pucar.dristi.web.models.casemodels.CaseAdvocateOffice office : advocateOffices) {
            String officeAdvocateUserUuid = office.getOfficeAdvocateUserUuid();

            // Check if office advocate is in assignedTo list
            if (officeAdvocateUserUuid != null && assignedUuids.contains(officeAdvocateUserUuid)) {
                List<String> memberIds = getMemberUserUuIds(office);

                AdvocateOffice analyticsOffice = AdvocateOffice.builder()
                        .advocateOfficeName(office.getOfficeAdvocateName())
                        .advocateUserUuid(officeAdvocateUserUuid)
                        .advocateId(office.getOfficeAdvocateId())
                        .officeMembers(memberIds)
                        .build();
                officesList.add(analyticsOffice);
            }
        }

        return mapper.writeValueAsString(officesList);
    }

    private static List<String> getMemberUserUuIds(CaseAdvocateOffice office) {
        List<String> memberIds = new ArrayList<>();

        // Add advocate members
        if (office.getAdvocates() != null) {
            for (AdvocateOfficeMember member : office.getAdvocates()) {
                if (member.getMemberUserUuid() != null) {
                    memberIds.add(member.getMemberUserUuid());
                }
            }
        }

        // Add clerk members
        if (office.getClerks() != null) {
            for (AdvocateOfficeMember member : office.getClerks()) {
                if (member.getMemberUserUuid() != null) {
                    memberIds.add(member.getMemberUserUuid());
                }
            }
        }
        return memberIds;
    }

    private AdvocateDetail getAdvocates(List<AdvocateMapping> representatives) {

        List<String> complainantNames = new ArrayList<>();
        List<String> accusedNames = new ArrayList<>();

        AdvocateDetail advocate = AdvocateDetail.builder().build();
        advocate.setComplainant(complainantNames);
        advocate.setAccused(accusedNames);

        if (representatives != null) {
            for (AdvocateMapping representative : representatives) {
                if (representative != null && representative.getAdditionalDetails() != null) {
                    Object additionalDetails = representative.getAdditionalDetails();
                    String advocateName = jsonUtil.getNestedValue(additionalDetails, List.of("advocateName"), String.class);
                    if (advocateName != null && !advocateName.isEmpty()) {
                        List<Party> representingList = Optional.ofNullable(representative.getRepresenting())
                                .orElse(Collections.emptyList());
                        if (!representingList.isEmpty()) {
                            Party first = representingList.get(0);
                            if (first.getPartyType() != null && first.getPartyType().contains("complainant")) {
                                complainantNames.add(advocateName);
                            } else {
                                accusedNames.add(advocateName);
                            }
                        }
                    }
                }
            }
        }


        return advocate;

    }

    private String getCourtId(String filingNumber, RequestInfo request) {
        try {
            request.getUserInfo().setType("EMPLOYEE");
            org.pucar.dristi.web.models.CaseSearchRequest caseSearchRequest = createCaseSearchRequest(request, filingNumber, null);
            JsonNode caseDetails = caseUtil.searchCaseDetails(caseSearchRequest);
            return caseDetails.get(0).path("courtId").textValue();
        } catch (Exception e) {
            log.error("Error occurred while getting court id: {}", e.toString());
        }
        return null;

    }

    private List<String> callIndividualService(RequestInfo requestInfo, List<String> individualIds) {

        List<String> mobileNumber = new ArrayList<>();
        for (String id : individualIds) {
            List<Individual> individuals = individualService.getIndividualsByIndividualId(requestInfo, id);
            if (individuals.get(0).getMobileNumber() != null) {
                mobileNumber.add(individuals.get(0).getMobileNumber());
            }
        }
        return mobileNumber;
    }

    private SmsTemplateData enrichSmsTemplateData(Map<String, String> details, String tenantId) {
        return SmsTemplateData.builder()
                .cmpNumber(details.get("cmpNumber"))
                .efilingNumber(details.get("filingNumber"))
                .tenantId(tenantId).build();
    }

    public CaseSearchRequest createCaseSearchRequest(RequestInfo requestInfo, String filingNumber, String caseId) {
        CaseSearchRequest caseSearchRequest = new CaseSearchRequest();
        caseSearchRequest.setRequestInfo(requestInfo);
        CaseCriteria caseCriteria = CaseCriteria.builder().filingNumber(filingNumber).defaultFields(false).build();
        if (caseId != null) {
            caseCriteria.setCaseId(caseId);
        }
        caseSearchRequest.addCriteriaItem(caseCriteria);
        return caseSearchRequest;
    }


    public Map<String, String> processEntity(String entityType, String referenceId, String status, String action, Object object, JSONObject requestInfo) {
        Map<String, String> caseDetails = new HashMap<>();
        String name = null;
        String screenType = null;
        boolean isCompleted = true;
        boolean isGeneric = false;
        String actors = null;
        String actionCategory = null;
        Long stateSla = null;
        List<ReferenceEntityTypeNameMapping> referenceEntityTypeMappings = null; // Store the reference mappings
        List<String> defaultRoles = null;

        List<PendingTaskType> pendingTaskTypeList = mdmsDataConfig.getPendingTaskTypeMap().get(entityType);
        if (pendingTaskTypeList == null) return caseDetails;

        // Determine name and isCompleted based on status and action
        for (PendingTaskType pendingTaskType : pendingTaskTypeList) {
            if (pendingTaskType.getState().equals(status) && pendingTaskType.getTriggerAction().contains(action)) {
                name = pendingTaskType.getPendingTask();
                screenType = pendingTaskType.getScreenType();
                actionCategory = pendingTaskType.getActionCategory();
                isCompleted = false;
                isGeneric = pendingTaskType.getIsgeneric();
                actors = pendingTaskType.getActor();
                referenceEntityTypeMappings = pendingTaskType.getReferenceEntityTypeNameMapping();
                defaultRoles = pendingTaskType.getDefaultRoles();
                stateSla = extractSlaFromMdms(pendingTaskType.getStateSla());
                break;
            }
        }

        if (isCompleted) {
            log.info("No pending task with this config");
            return caseDetails;
        }

        // Create request and process entity based on type
        JSONObject request = new JSONObject();
        request.put("RequestInfo", requestInfo);
        Map<String, String> entityDetails = processEntityByType(entityType, request, referenceId, object);

        // Update name based on referenceEntityType and referenceEntityTypeNameMapping

        Map<String, String> updatedTaskNameAndActionCategory = getUpdatedTaskNameAndActionCategory(entityDetails, referenceEntityTypeMappings);

        if (updatedTaskNameAndActionCategory != null && updatedTaskNameAndActionCategory.get("name") != null) {
            name = updatedTaskNameAndActionCategory.get("name");
        }
        if (updatedTaskNameAndActionCategory != null && updatedTaskNameAndActionCategory.get("actionCategory") != null) {
            actionCategory = updatedTaskNameAndActionCategory.get("actionCategory");
        }

        // Add additional details to the caseDetails map
        caseDetails.putAll(entityDetails);
        caseDetails.put("name", name);
        caseDetails.put("screenType", screenType);
        caseDetails.put("actionCategory", actionCategory);
        if (defaultRoles != null) {
            caseDetails.put("defaultRoles", defaultRoles.toString());
        }
        caseDetails.put("actors", actors);
        if (stateSla != null) {
            caseDetails.put("stateSla", String.valueOf(stateSla));
        }
        if (isGeneric) caseDetails.put("isGeneric", "Generic");

        return caseDetails;
    }

    private Long extractSlaFromMdms(String stateSla) {
        try {
            return Long.parseLong(stateSla);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    public Map<String, String> processEntityByType(String entityType, JSONObject request, String referenceId, Object object) {
        try {
            if (config.getHearingBusinessServiceList().contains(entityType))
                return processHearingEntity(request, object);
            else if (config.getCaseBusinessServiceList().contains(entityType))
                return processCaseEntity(request, referenceId);
            else if (config.getEvidenceBusinessServiceList().contains(entityType))
                return processEvidenceEntity(request, referenceId);
            else if (config.getApplicationBusinessServiceList().contains(entityType))
                return processApplicationEntity(request, referenceId);
            else if (config.getOrderBusinessServiceList().contains(entityType))
                return processOrderEntity(request, object);
            else if (config.getTaskBusinessServiceList().contains(entityType))
                return processTaskEntity(request, referenceId);
            else if (config.getADiaryBusinessServiceList().contains(entityType))
                return processADiaryEntity(request, referenceId);
            else if (config.getBailBondBusinessServiceList().contains(entityType))
                return processBailBondEntity(request, referenceId);
            else if (config.getTaskManagementBusinessServiceList().contains(entityType))
                return processTaskManagementEntity(request, referenceId);
            else if (config.getDigitalizedDocumentsBusinessServiceList().contains(entityType))
                return processDigitalizedDocumentsEntity(request, referenceId);
            else {
                log.error("Unexpected entityType: {}", entityType);
                return new HashMap<>();
            }
        } catch (InterruptedException e) {
            log.error("Processing interrupted for entityType: {}", entityType, e);
            Thread.currentThread().interrupt(); // Restore the interrupted status
            throw new RuntimeException(e);
        }
    }

    private Map<String, String> processHearingEntity(JSONObject request, Object hearingObject) throws InterruptedException {
        Map<String, String> caseDetails = new HashMap<>();
        List<String> cnrNumbers = JsonPath.read(hearingObject.toString(), CNR_NUMBERS_PATH);
        String cnrNumber;
        String filingNumber;
        String caseId;
        String caseTitle;

        if (cnrNumbers == null || cnrNumbers.isEmpty()) {
            List<String> filingNumberList = JsonPath.read(hearingObject.toString(), FILING_NUMBER_PATH);
            if (filingNumberList != null && !filingNumberList.isEmpty()) {
                filingNumber = filingNumberList.get(0);
            } else {
                log.info("Inside indexer util processEntity:: Both cnr and filing numbers are not present");
                return caseDetails;
            }
            Object caseObject = caseUtil.getCase(request, config.getStateLevelTenantId(), null, filingNumber, null);
            cnrNumber = JsonPath.read(caseObject.toString(), CNR_NUMBER_PATH);
            caseId = JsonPath.read(caseObject.toString(), CASEID_PATH);
            caseTitle = JsonPath.read(caseObject.toString(), CASE_TITLE_PATH);
        } else {
            cnrNumber = cnrNumbers.get(0);
            Object caseObject = caseUtil.getCase(request, config.getStateLevelTenantId(), cnrNumber, null, null);
            filingNumber = JsonPath.read(caseObject.toString(), FILING_NUMBER_PATH);
            caseId = JsonPath.read(caseObject.toString(), CASEID_PATH);
            caseTitle = JsonPath.read(caseObject.toString(), CASE_TITLE_PATH);
        }

        caseDetails.put("cnrNumber", cnrNumber);
        caseDetails.put("filingNumber", filingNumber);
        caseDetails.put("caseId", caseId);
        caseDetails.put("caseTitle", caseTitle);
        return caseDetails;
    }

    private Map<String, String> processCaseEntity(JSONObject request, String referenceId) throws InterruptedException {
        Map<String, String> caseDetails = new HashMap<>();
        Thread.sleep(config.getApiCallDelayInSeconds() * 1000);
        Object caseObject = caseUtil.getCase(request, config.getStateLevelTenantId(), null, referenceId, null);
        String cnrNumber = JsonPath.read(caseObject.toString(), CNR_NUMBER_PATH);
        String cmpNumber = JsonPath.read(caseObject.toString(), CMP_NUMBER_PATH);

        String caseId = JsonPath.read(caseObject.toString(), CASEID_PATH);
        String caseTitle = JsonPath.read(caseObject.toString(), CASE_TITLE_PATH);
        Long caseFilingDate = JsonPath.read(caseObject.toString(), CASE_FILING_DATE_PATH);
        // TODO: Get section and sub-section from case object
        String sectionAndSubSection = config.getCaseSectionAndSubSection();

        caseDetails.put("cnrNumber", cnrNumber);
        caseDetails.put("filingNumber", referenceId);
        caseDetails.put("cmpNumber", cmpNumber);
        caseDetails.put("caseId", caseId);
        caseDetails.put("caseTitle", caseTitle);
        caseDetails.put("filingDate", String.valueOf(caseFilingDate));
        caseDetails.put("sectionAndSubSection", sectionAndSubSection);

        return caseDetails;
    }

    private Map<String, String> processEvidenceEntity(JSONObject request, String referenceId) throws InterruptedException {
        Map<String, String> caseDetails = new HashMap<>();
        Thread.sleep(config.getApiCallDelayInSeconds() * 1000);
        Object artifactObject = evidenceUtil.getEvidence(request, config.getStateLevelTenantId(), referenceId);
        String filingNumber = JsonPath.read(artifactObject.toString(), FILING_NUMBER_PATH);
        Object caseObject = caseUtil.getCase(request, config.getStateLevelTenantId(), null, filingNumber, null);
        String cnrNumber = JsonPath.read(caseObject.toString(), CNR_NUMBER_PATH);

        String caseId = JsonPath.read(caseObject.toString(), CASEID_PATH);
        String caseTitle = JsonPath.read(caseObject.toString(), CASE_TITLE_PATH);

        caseDetails.put("cnrNumber", cnrNumber);
        caseDetails.put("filingNumber", filingNumber);
        caseDetails.put("caseId", caseId);
        caseDetails.put("caseTitle", caseTitle);

        return caseDetails;
    }

    private Map<String, String> processTaskEntity(JSONObject request, String referenceId) throws InterruptedException {
        Map<String, String> caseDetails = new HashMap<>();
        Thread.sleep(config.getApiCallDelayInSeconds() * 1000);
        Object taskObject = taskUtil.getTask(request, config.getStateLevelTenantId(), referenceId, null, null);
        String filingNumber = JsonPath.read(taskObject.toString(), FILING_NUMBER_PATH);

        Object caseObject = caseUtil.getCase(request, config.getStateLevelTenantId(), null, filingNumber, null);

        String caseId = JsonPath.read(caseObject.toString(), CASEID_PATH);
        String caseTitle = JsonPath.read(caseObject.toString(), CASE_TITLE_PATH);
        String cnrNumber = JsonPath.read(caseObject.toString(), CNR_NUMBER_PATH);

        caseDetails.put("cnrNumber", cnrNumber);
        caseDetails.put("filingNumber", filingNumber);
        caseDetails.put("caseId", caseId);
        caseDetails.put("caseTitle", caseTitle);

        return caseDetails;
    }

    private Map<String, String> processTaskManagementEntity(JSONObject request, String referenceId) throws InterruptedException {
        Map<String, String> caseDetails = new HashMap<>();
        Thread.sleep(config.getApiCallDelayInSeconds() * 1000);

        TaskSearchCriteria searchCriteria = TaskSearchCriteria.builder()
                .tenantId(config.getStateLevelTenantId())
                .taskManagementNumber(referenceId)
                .build();

        RequestInfo requestInfo = mapper.convertValue(request.get("RequestInfo"), RequestInfo.class);

        TaskSearchRequest searchRequest = TaskSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(searchCriteria)
                .build();
        List<TaskManagement> taskManagementList = taskManagementUtil.searchTaskManagement(searchRequest);
        if (taskManagementList.isEmpty()) {
            log.error("Task management not found for reference id: " + referenceId);
            return caseDetails;
        }
        TaskManagement taskManagement = taskManagementList.get(0);
        String filingNumber = taskManagement.getFilingNumber();

        Object caseObject = caseUtil.getCase(request, config.getStateLevelTenantId(), null, filingNumber, null);

        String caseId = JsonPath.read(caseObject.toString(), CASEID_PATH);
        String caseTitle = JsonPath.read(caseObject.toString(), CASE_TITLE_PATH);
        String cnrNumber = JsonPath.read(caseObject.toString(), CNR_NUMBER_PATH);

        caseDetails.put("cnrNumber", cnrNumber);
        caseDetails.put("filingNumber", filingNumber);
        caseDetails.put("caseId", caseId);
        caseDetails.put("caseTitle", caseTitle);

        return caseDetails;
    }

    private Map<String, String> processDigitalizedDocumentsEntity(JSONObject request, String referenceId) throws InterruptedException {

        Map<String, String> caseDetails = new HashMap<>();
        Thread.sleep(config.getApiCallDelayInSeconds() * 1000);

        String filingNumber = getFilingNumberFromBusinessId(referenceId);

        Object caseObject = caseUtil.getCase(request, config.getStateLevelTenantId(), null, filingNumber, null);

        String caseId = JsonPath.read(caseObject.toString(), CASEID_PATH);
        String caseTitle = JsonPath.read(caseObject.toString(), CASE_TITLE_PATH);
        String cnrNumber = JsonPath.read(caseObject.toString(), CNR_NUMBER_PATH);

        caseDetails.put("cnrNumber", cnrNumber);
        caseDetails.put("filingNumber", filingNumber);
        caseDetails.put("caseId", caseId);
        caseDetails.put("caseTitle", caseTitle);

        return caseDetails;

    }

    private String getFilingNumberFromBusinessId(String businessId) {
        String[] parts = businessId.split("-");
        String result = String.join("-", parts[0], parts[1], parts[2]);
        log.info(result);
        return result;
    }


    private Map<String, String> processADiaryEntity(JSONObject request, String referenceId) throws InterruptedException {
        Map<String, String> caseDetails = new HashMap<>();
        caseDetails.put("cnrNumber", null);
        caseDetails.put("filingNumber", null);
        caseDetails.put("caseId", null);
        caseDetails.put("caseTitle", null);
        return caseDetails;
    }

    private Map<String, String> processApplicationEntity(JSONObject request, String referenceId) throws InterruptedException {
        Map<String, String> caseDetails = new HashMap<>();
        Thread.sleep(config.getApiCallDelayInSeconds() * 1000);
        Object applicationObject = applicationUtil.getApplication(request, config.getStateLevelTenantId(), referenceId);
        String filingNumber = JsonPath.read(applicationObject.toString(), FILING_NUMBER_PATH);

        Object caseObject = caseUtil.getCase(request, config.getStateLevelTenantId(), null, filingNumber, null);

        String applicationType = JsonPath.read(applicationObject.toString(), APPLICATION_TYPE_PATH);
        String caseId = JsonPath.read(caseObject.toString(), CASEID_PATH);
        String caseTitle = JsonPath.read(caseObject.toString(), CASE_TITLE_PATH);
        String cnrNumber = JsonPath.read(caseObject.toString(), CNR_NUMBER_PATH);
        caseDetails.put("referenceEntityType", applicationType);

        caseDetails.put("cnrNumber", cnrNumber);
        caseDetails.put("filingNumber", filingNumber);
        caseDetails.put("caseId", caseId);
        caseDetails.put("caseTitle", caseTitle);
        if(ADVANCEMENT_OR_ADJOURNMENT_APPLICATION.equalsIgnoreCase(applicationType)){
            Long initialHearingEpoch = JsonPath.read(applicationObject.toString(), INITIAL_HEARING_DATE_PATH);
            caseDetails.put("nextHearingDate", formatEpoch(initialHearingEpoch));
            caseDetails.put("dateOfApplication", formatEpoch(System.currentTimeMillis()));
        }
        return caseDetails;
    }

    private String formatEpoch(Long epoch) {
        if (epoch == null) return "";

        return Instant.ofEpochMilli(epoch)
                .atZone(ZoneId.of("Asia/Kolkata"))
                .toLocalDate()
                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }

    private Map<String, String> processOrderEntity(JSONObject request, Object orderObject) throws InterruptedException {
        Map<String, String> caseDetails = new HashMap<>();
        String filingNumber = JsonPath.read(orderObject.toString(), FILING_NUMBER_PATH);

        Object caseObject = caseUtil.getCase(request, config.getStateLevelTenantId(), null, filingNumber, null);

        String caseId = JsonPath.read(caseObject.toString(), CASEID_PATH);
        String caseTitle = JsonPath.read(caseObject.toString(), CASE_TITLE_PATH);
        String cnrNumber = JsonPath.read(caseObject.toString(), CNR_NUMBER_PATH);

        caseDetails.put("cnrNumber", cnrNumber);
        caseDetails.put("filingNumber", filingNumber);
        caseDetails.put("caseId", caseId);
        caseDetails.put("caseTitle", caseTitle);
        return caseDetails;
    }

    private Map<String, String> processBailBondEntity(JSONObject request, String referenceId) throws InterruptedException {
        Map<String, String> caseDetails = new HashMap<>();
        Thread.sleep(config.getApiCallDelayInSeconds() * 1000);
        String filingNumber = extractFilingNumberFromReferenceId(referenceId);
        log.info(filingNumber);

        Object caseObject = caseUtil.getCase(request, config.getStateLevelTenantId(), null, filingNumber, null);

        String caseId = JsonPath.read(caseObject.toString(), CASEID_PATH);
        String caseTitle = JsonPath.read(caseObject.toString(), CASE_TITLE_PATH);
        String cnrNumber = JsonPath.read(caseObject.toString(), CNR_NUMBER_PATH);

        caseDetails.put("cnrNumber", cnrNumber);
        caseDetails.put("filingNumber", filingNumber);
        caseDetails.put("caseId", caseId);
        caseDetails.put("caseTitle", caseTitle);

        return caseDetails;
    }

    private String extractFilingNumberFromReferenceId(String referenceId) {
        String[] parts = referenceId.split("-");
        return String.join("-", parts[0], parts[1], parts[2]);
    }

    public void esPost(String uri, String request) {
        try {
            log.debug("Record being indexed: {}", request);

            final HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON_UTF8);
            headers.add("Authorization", getESEncodedCredentials());
            final HttpEntity<String> entity = new HttpEntity<>(request, headers);

            String response = restTemplate.postForObject(uri, entity, String.class);
            if (uri.contains("_bulk") && JsonPath.read(response, ERRORS_PATH).equals(true)) {
                log.info("Indexing FAILED!!!!");
                log.info("Response from ES: {}", response);
            }
        } catch (final ResourceAccessException e) {
            log.error("ES is DOWN, Pausing kafka listener.......");
            orchestrateListenerOnESHealth();
        } catch (Exception e) {
            log.error("Exception while trying to index the ES documents. Note: ES is not Down.", e);
        }
    }

    public void esPostManual(String uri, String request) throws Exception {
        try {
            log.debug("Record being indexed manually: {}", request);

            final HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON_UTF8);
            headers.add("Authorization", getESEncodedCredentials());
            final HttpEntity<String> entity = new HttpEntity<>(request, headers);

            String response = restTemplate.postForObject(uri, entity, String.class);
            if (uri.contains("_bulk") && JsonPath.read(response, ERRORS_PATH).equals(true)) {
                log.info("Manual Indexing FAILED!!!!");
                log.info("Response from ES for manual push: {}", response);
                throw new Exception("Error while updating index");
            }
        } catch (Exception e) {
            log.error("Exception while trying to index the ES documents. Note: ES is not Down.", e);
            throw e;
        }
    }

    public Long getSla(Long stateSla) {
        long currentTime = clock.millis();
        if (stateSla == null || stateSla < ONE_DAY_DURATION_MILLIS) {
            stateSla = currentTime + ONE_DAY_DURATION_MILLIS;
        } else {
            stateSla += currentTime;
        }
        return stateSla;
    }

    private Map<String, String> getUpdatedTaskNameAndActionCategory(Map<String, String> entityDetails,
                                                                    List<ReferenceEntityTypeNameMapping> referenceEntityTypeMappings) {

        if (referenceEntityTypeMappings == null || referenceEntityTypeMappings.isEmpty()
                || entityDetails.isEmpty()
                || entityDetails.get("referenceEntityType") == null
                || !entityDetails.containsKey("referenceEntityType")) {
            return null;
        }

        String applicationType = entityDetails.get("referenceEntityType");

        Map<String, String> updatedTaskNameAndActionCategory = new HashMap<>();

        // Check if referenceEntityTypeMappings has any mappings
        for (ReferenceEntityTypeNameMapping mapping : referenceEntityTypeMappings) {
            if (mapping.getPendingTaskName() != null && applicationType.equalsIgnoreCase(mapping.getReferenceEntityType())) {
                updatedTaskNameAndActionCategory.put("name", mapping.getPendingTaskName());
            }
            if (mapping.getActionCategory() != null && applicationType.equalsIgnoreCase(mapping.getReferenceEntityType())) {
                updatedTaskNameAndActionCategory.put("actionCategory", mapping.getActionCategory());
            }
        }

        return updatedTaskNameAndActionCategory;
    }

}
