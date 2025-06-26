package org.pucar.dristi.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.enrichment.TaskRegistrationEnrichment;
import org.pucar.dristi.enrichment.TopicBasedOnStatus;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.TaskRepository;
import org.pucar.dristi.util.*;
import org.pucar.dristi.validators.TaskRegistrationValidator;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.function.BiConsumer;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.pucar.dristi.config.ServiceConstants.*;

@Service
@Slf4j
public class TaskService {

    private TaskRegistrationValidator validator;
    private final TaskRegistrationEnrichment enrichmentUtil;
    private final TaskRepository taskRepository;
    private final WorkflowUtil workflowUtil;
    private final Configuration config;
    private final Producer producer;
    private final CaseUtil caseUtil;
    private final ObjectMapper objectMapper;
    private final SmsNotificationService notificationService;
    private final IndividualService individualService;
    private final TopicBasedOnStatus topicBasedOnStatus;
    private final SummonUtil summonUtil;
    private final FileStoreUtil fileStoreUtil;
    private final EtreasuryUtil etreasuryUtil;
    private final PendingTaskUtil pendingTaskUtil;

    @Autowired
    public TaskService(TaskRegistrationValidator validator,
                       TaskRegistrationEnrichment enrichmentUtil,
                       TaskRepository taskRepository,
                       WorkflowUtil workflowUtil,
                       Configuration config,
                       Producer producer, CaseUtil caseUtil, ObjectMapper objectMapper, SmsNotificationService notificationService, IndividualService individualService, TopicBasedOnStatus topicBasedOnStatus, SummonUtil summonUtil, FileStoreUtil fileStoreUtil, EtreasuryUtil etreasuryUtil, PendingTaskUtil pendingTaskUtil) {
        this.validator = validator;
        this.enrichmentUtil = enrichmentUtil;
        this.taskRepository = taskRepository;
        this.workflowUtil = workflowUtil;
        this.config = config;
        this.producer = producer;
        this.caseUtil = caseUtil;
        this.objectMapper = objectMapper;
        this.notificationService = notificationService;
        this.individualService = individualService;
        this.topicBasedOnStatus = topicBasedOnStatus;
        this.summonUtil = summonUtil;
        this.fileStoreUtil = fileStoreUtil;
        this.etreasuryUtil = etreasuryUtil;
        this.pendingTaskUtil = pendingTaskUtil;
    }

    @Autowired
    public void setValidator(@Lazy TaskRegistrationValidator validator) {
        this.validator = validator;
    }


    public Task createTask(TaskRequest body) {
        try {
            validator.validateTaskRegistration(body);

            enrichmentUtil.enrichTaskRegistration(body);

            if(body.getTask().getTaskType().equalsIgnoreCase(GENERIC)) {
                updateAssignedToList(body);
                createDemandForPayment(body);
            }
            workflowUpdate(body);

            if(body.getTask().getTaskType().equalsIgnoreCase("SUMMONS")
             || body.getTask().getTaskType().equalsIgnoreCase("WARRANT")) {
                updateCase(body);
            }
            producer.push(config.getTaskCreateTopic(), body);

            String status = body.getTask().getStatus();
            String taskType = body.getTask().getTaskType();
            String messageCode = status != null ? getMessageCode(taskType, status) : null;
            log.info("Message Code :: {}", messageCode);
            if (messageCode != null) {
                callNotificationService(body, messageCode);
            }

            return body.getTask();

        } catch (CustomException e) {
            log.error("Custom Exception occurred while creating task :: {}", e.toString());
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while creating task :: {}", e.toString());
            throw new CustomException(CREATE_TASK_ERR, e.getMessage());
        }
    }

    public void createDemandForPayment(TaskRequest body) {
        try {
            Map<String, Object> taskDetails = (Map<String, Object>) body.getTask().getTaskDetails();
            Map<String, Object> genericTaskDetails = (Map<String, Object>) taskDetails.get("genericTaskDetails");

            if (genericTaskDetails == null) {
                throw new IllegalArgumentException("genericTaskDetails not found in taskDetails");
            }
            String consumerCode = getConsumerCode(body);
            genericTaskDetails.put("consumerCode", consumerCode);
            Object feeBreakDown = genericTaskDetails.get("feeBreakDown");
            Calculation calculation = objectMapper.convertValue(feeBreakDown, Calculation.class);
            etreasuryUtil.createDemand(body, consumerCode, calculation);
        } catch (Exception e) {
            log.error("Error occurred while creating demand for payment :: {}", e.toString());
            throw new CustomException("ERROR_CREATING_DEMAND_FOR_PAYMENT", e.getMessage());
        }
    }

    private String getConsumerCode(TaskRequest body) {
        return body.getTask().getTaskNumber() + "_GENERIC";
    }

    public void updateAssignedToList(TaskRequest body) {
        try {
            List<AssignedTo> assignedToList = body.getTask().getAssignedTo();
            List<AssignedTo> newAssignedToList = new ArrayList<>(assignedToList); // Create a new list to avoid ConcurrentModificationException
            List<CourtCase> courtCases = caseUtil.getCaseDetails(body);

            for(AssignedTo assignedTo : newAssignedToList) {
                String uuid = assignedTo.getUuid().toString();
                List<AdvocateMapping> representatives = courtCases.get(0).getRepresentatives();
                for (AdvocateMapping advocateMapping : representatives){
                    List<Party> parties = advocateMapping.getRepresenting();
                    List<String> individualIds = parties.stream().filter(party -> uuid.equalsIgnoreCase(objectMapper.convertValue(party.getAdditionalDetails(), JsonNode.class).get("uuid").textValue()))
                            .map(Party::getIndividualId)
                            .toList();
                    if(!individualIds.isEmpty()) {
                        assignedToList.add(AssignedTo.builder().uuid(UUID.fromString(objectMapper.convertValue(advocateMapping.getAdditionalDetails(), JsonNode.class).get("uuid").textValue())).build());
                    }
                }
            }
            if(!assignedToList.isEmpty()){
                body.getTask().getWorkflow().setAssignes(assignedToList.stream().map(assignedTo -> assignedTo.getUuid().toString()).toList());
                body.getTask().getWorkflow().setAdditionalDetails(getAdditionalDetails(body.getTask()));
            }
        } catch (Exception e) {
            log.error("Error occurred while updating assignedTo list :: {}", e.toString());
            throw new CustomException("ERROR_UPDATING_ASSIGNED_TO_LIST",e.getMessage());
        }
    }

    private Object getAdditionalDetails(Task task) {
        Map<String, Object> additionalDetails = new HashMap<>();
        additionalDetails.put("dueDate", task.getDuedate());
        return additionalDetails;
    }

    public List<Task> searchTask(TaskSearchRequest request) {

        try {
            // Fetch tasks from database according to the given search criteria
            return taskRepository.getTasks(request.getCriteria(), request.getPagination());
        } catch (CustomException e) {
            log.error("Custom Exception occurred while searching task :: {}", e.toString());
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching task results :: {}", e.toString());
            throw new CustomException(SEARCH_TASK_ERR, e.getMessage());
        }
    }

    public Task updateTask(TaskRequest body) {

        try {
            log.info("operation=updateTask, status=IN_PROGRESS, BODY: {}", body);
            // Validate whether the application that is being requested for update indeed exists
            if (!validator.validateApplicationExistence(body.getTask(), body.getRequestInfo()))
                throw new CustomException(VALIDATION_ERR, "Task Application does not exist");

            // Enrich application upon update
            enrichmentUtil.enrichCaseApplicationUponUpdate(body);

            boolean isValidTask = true;

            if (body.getTask().getTaskType().equalsIgnoreCase(JOIN_CASE)) {
                isValidTask = validator.isValidJoinCasePendingTask(body);
                if (!isValidTask) {
                    body.getTask().getWorkflow().setAction(REJECT);
                    log.info("pending task is no more valid rejecting by system");
                }
            }

            workflowUpdate(body);

            String status = body.getTask().getStatus();
            String taskType = body.getTask().getTaskType();
            log.info("status , taskType : {} , {} ", status, taskType);
            if (SUMMON_SENT.equalsIgnoreCase(status) || NOTICE_SENT.equalsIgnoreCase(status) || WARRANT_SENT.equalsIgnoreCase(status)){
                String acknowledgementId = summonUtil.sendSummons(body);
                updateAcknowledgementId(body, acknowledgementId);
            }
            List<String> fileStoreIds = new ArrayList<>();
            if(body.getTask().getDocuments() != null){
                for (Document document : body.getTask().getDocuments()) {
                    if (!document.getIsActive()) {
                        fileStoreIds.add(document.getFileStore());
                    }
                }
            }
            if(!fileStoreIds.isEmpty()){
                fileStoreUtil.deleteFilesByFileStore(fileStoreIds, body.getTask().getTenantId());
                log.info("Deleted files from file store: {}", fileStoreIds);
            }
            // push to join case topic based on status
            if (taskType.equalsIgnoreCase(JOIN_CASE)) {
                topicBasedOnStatus.pushToTopicBasedOnStatus(status, body);
            }

            producer.push(config.getTaskUpdateTopic(), body);

            if (!isValidTask) {
                // join case pending task is not valid
                throw new CustomException(INVALID_PENDING_TASK,"the pending task is not valid");
            }

            String messageCode = status != null ? getMessageCode(taskType, status) : null;
            log.info("Message Code :: {}", messageCode);
            if(messageCode != null){
                callNotificationService(body, messageCode);
            }

            log.info("operation=updateTask, status=SUCCESS, BODY: {}", body);

            filterDocuments(new ArrayList<>() {{
                                add(body.getTask());
                            }},
                    Task::getDocuments,
                    Task::setDocuments);

            return body.getTask();

        } catch (CustomException e) {
            log.error("Custom Exception occurred while updating task :: {}", e.toString());
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while updating task :: {}", e.toString());
            throw new CustomException(UPDATE_TASK_ERR, "Error occurred while updating task: " + e.getMessage());
        }

    }

    private <T> void filterDocuments(List<T> entities,
                                     Function<T, List<Document>> getDocs,
                                     BiConsumer<T, List<Document>> setDocs) {
        if (entities == null) return;

        for (T entity : entities) {
            List<Document> docs = getDocs.apply(entity);
            if (docs != null) {
                List<Document> activeDocs = docs.stream()
                        .filter(Document::getIsActive)
                        .collect(Collectors.toList());
                setDocs.accept(entity, activeDocs); // ✅ set it back
            }
        }
    }

    private void updateAcknowledgementId(TaskRequest body, String acknowledgementId) {
        JsonNode taskDetails = objectMapper.convertValue(body.getTask().getTaskDetails(), JsonNode.class);
        ObjectNode deliveryChannels = (ObjectNode) taskDetails.get("deliveryChannels");
        deliveryChannels.put("channelAcknowledgementId", acknowledgementId);
        body.getTask().setTaskDetails(taskDetails);
    }

    public TaskExists existTask(TaskExistsRequest taskExistsRequest) {
        try {
            return taskRepository.checkTaskExists(taskExistsRequest.getTask());
        } catch (CustomException e) {
            log.error("Custom Exception occurred while exist task check :: {}", e.toString());
            throw e;
        } catch (Exception e) {
            log.error("Error while fetching to exist task :: {}", e.toString());
            throw new CustomException(EXIST_TASK_ERR, e.getMessage());
        }
    }

    private void workflowUpdate(TaskRequest taskRequest) throws JsonProcessingException {
        Task task = taskRequest.getTask();
        RequestInfo requestInfo = taskRequest.getRequestInfo();

        String taskType = task.getTaskType().toUpperCase();
        String tenantId = task.getTenantId();
        String taskNumber = task.getTaskNumber();
        WorkflowObject workflow = task.getWorkflow();
        String status = switch (taskType) {
            case BAIL -> workflowUtil.updateWorkflowStatus(requestInfo, tenantId, taskNumber,
                    config.getTaskBailBusinessServiceName(), workflow, config.getTaskBailBusinessName());
            case SUMMON -> workflowUtil.updateWorkflowStatus(requestInfo, tenantId, taskNumber,
                    config.getTaskSummonBusinessServiceName(), workflow, config.getTaskSummonBusinessName());
            case WARRANT -> workflowUtil.updateWorkflowStatus(requestInfo, tenantId, taskNumber,
                    config.getTaskWarrantBusinessServiceName(), workflow, config.getTaskWarrantBusinessName());
            case NOTICE -> workflowUtil.updateWorkflowStatus(requestInfo, tenantId, taskNumber,
                    config.getTaskNoticeBusinessServiceName(), workflow, config.getTaskNoticeBusinessName());
            case JOIN_CASE -> workflowUtil.updateWorkflowStatus(requestInfo, tenantId, taskNumber,
                    config.getTaskJoinCaseBusinessServiceName(), workflow, config.getTaskjoinCaseBusinessName());
            case JOIN_CASE_PAYMENT -> workflowUtil.updateWorkflowStatus(requestInfo, tenantId, taskNumber,
                    config.getTaskPaymentBusinessServiceName(), workflow, config.getTaskPaymentBusinessName());
            case GENERIC -> updateWorkflow(requestInfo, tenantId, taskNumber, workflow);
            default -> workflowUtil.updateWorkflowStatus(requestInfo, tenantId, taskNumber,
                    config.getTaskBusinessServiceName(), workflow, config.getTaskBusinessName());
        };

        task.setStatus(status);
    }

    private String updateWorkflow(RequestInfo requestInfo, String tenantId, String taskNumber, WorkflowObject workflow) throws JsonProcessingException {
        workflow.setAdditionalDetails(getAdditionalDetailsForExcludingRoles());
        return workflowUtil.updateWorkflowStatus(requestInfo, tenantId, taskNumber,
                config.getTaskGenericBusinessServiceName(), workflow, config.getTaskGenericBusinessName());
    }

    private Object getAdditionalDetailsForExcludingRoles() throws JsonProcessingException {
        return objectMapper.readValue("{\"excludeRoles\":[\"TASK_CREATOR\"]}", Object.class);
    }
    public Task uploadDocument(TaskRequest body) {
        try {
            Task task = validator.validateApplicationUploadDocumentExistence(body.getTask(), body.getRequestInfo());

            // Enrich application upon update
           TaskRequest taskRequest = TaskRequest.builder().requestInfo(body.getRequestInfo()).task(task).build();
            enrichmentUtil.enrichCaseApplicationUponUpdate(taskRequest);

            producer.push(config.getTaskUpdateTopic(), taskRequest);

            closeEnvelopePendingTaskOfRpad(taskRequest);

            return taskRequest.getTask();

        } catch (CustomException e) {
            log.error("Custom Exception occurred while uploading document into task :: {}", e.toString());
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while uploading document into task :: {}", e.toString());
            throw new CustomException(DOCUMENT_UPLOAD_QUERY_EXCEPTION, "Error occurred while uploading document into task: " + e.getMessage());
        }
    }

    public void closeEnvelopePendingTaskOfRpad(TaskRequest taskRequest) {
        Task task = taskRequest.getTask();
        if ((task.getTaskType().equalsIgnoreCase(SUMMON) || task.getTaskType().equalsIgnoreCase(WARRANT)
                || task.getTaskType().equalsIgnoreCase(NOTICE)) && (isRPADdeliveryChannel(task))) {
            closeEnvelopePendingTask(taskRequest);
        }
    }

    private void closeEnvelopePendingTask(TaskRequest taskRequest) {
        Task task = taskRequest.getTask();
        String referenceId = MANUAL + task.getTaskNumber() + PENDING_ENVELOPE_SUBMISSION;
        pendingTaskUtil.closeManualPendingTask(referenceId, taskRequest.getRequestInfo(), task.getFilingNumber(),
                task.getCnrNumber(), task.getCaseId(), task.getCaseTitle(), task.getTaskType());
    }

    private boolean isRPADdeliveryChannel(Task task) {
        JsonNode taskDetails = objectMapper.convertValue(task.getTaskDetails(), JsonNode.class);

        // Check if deliveryChannels exists
        ObjectNode deliveryChannels = null;
        if (taskDetails.has("deliveryChannels") && !taskDetails.get("deliveryChannels").isNull()) {
            deliveryChannels = (ObjectNode) taskDetails.get("deliveryChannels");
        }

        if (deliveryChannels == null) {
            return false;
        }

        if (deliveryChannels.has(CHANNEL_CODE) && !deliveryChannels.get(CHANNEL_CODE).isNull()) {
            String channelCode = deliveryChannels.get(CHANNEL_CODE).textValue();
            return channelCode != null && channelCode.equalsIgnoreCase(RPAD);
        }
        return false;
    }

    public List<TaskCase> searchCaseTask(TaskCaseSearchRequest request) {
        return taskRepository.getTaskWithCaseDetails(request);

    }

    private void callNotificationService(TaskRequest taskRequest, String messageCode) {
        try {
            JsonNode caseList = caseUtil.searchCaseDetails(taskRequest.getRequestInfo(), taskRequest.getTask().getTenantId(), null, taskRequest.getTask().getFilingNumber(), null);
            if(caseList.isEmpty()) {
                throw new CustomException(ERROR_WHILE_FETCHING_FROM_CASE, "Case Not Found!");
            }
            JsonNode caseDetails = caseList.get(0);
            Object taskDetailsObject = taskRequest.getTask().getTaskDetails();
            JsonNode taskDetails = objectMapper.readTree(objectMapper.writeValueAsString(taskDetailsObject));

            String accusedName = taskDetails.has("respondentDetails") ? taskDetails.path("respondentDetails").path("name").textValue() : "";

            Set<String> individualIds = extractComplainantIndividualIds(caseDetails);
            extractPowerOfAttorneyIds(caseDetails, individualIds);

            if (Objects.equals(messageCode, WARRANT_ISSUED)) {
                 accusedName = accusedName.split(" \\(")[0];
                individualIds = extractIndividualIds(caseDetails,accusedName);
            }

            Set<String> phoneNumbers = callIndividualService(taskRequest.getRequestInfo(), individualIds);

            SmsTemplateData smsTemplateData = SmsTemplateData.builder()
                    .courtCaseNumber(caseDetails.has("courtCaseNumber") ? caseDetails.get("courtCaseNumber").textValue() : "")
                    .cmpNumber(caseDetails.has("cmpNumber") ? caseDetails.get("cmpNumber").textValue() : "")
                    .accusedName(accusedName)
                    .tenantId(taskRequest.getTask().getTenantId()).build();

            for (String number : phoneNumbers) {
                notificationService.sendNotification(taskRequest.getRequestInfo(), smsTemplateData, messageCode, number);
            }
        }
        catch (Exception e) {
            log.error("Error occurred while sending notification: {}", e.toString());
        }
    }

    public  Set<String> extractComplainantIndividualIds(JsonNode caseDetails) {

        JsonNode litigantNode = caseDetails.get("litigants");
        JsonNode representativeNode = caseDetails.get("representatives");
        Set<String> uuids = new HashSet<>();

        if (litigantNode.isArray()) {
            for (JsonNode node : litigantNode) {
                if (node.get("partyType").asText().contains("complainant")) {
                    String uuid = node.path("additionalDetails").get("uuid").asText();
                    if (!uuid.isEmpty() ) {
                        uuids.add(uuid);
                    }
                }
            }
        }

        if (representativeNode.isArray()) {
            for (JsonNode advocateNode : representativeNode) {
                JsonNode representingNode = advocateNode.get("representing");
                if (representingNode.isArray()) {
                    if(representingNode.get(0).get("partyType").asText().contains("complainant")) {
                        String uuid = advocateNode.path("additionalDetails").get("uuid").asText();
                        if (!uuid.isEmpty() ) {
                            uuids.add(uuid);
                        }

                    }
                }
            }
        }
        return uuids;
    }

    public Set<String> extractIndividualIds(JsonNode caseDetails,String respondentName) {
        JsonNode litigantNode = caseDetails.get("litigants");
        Set<String> uuids = new HashSet<>();

        if (litigantNode.isArray()) {
            for (JsonNode node : litigantNode) {
                String name = node.path("additionalDetails").get("fullName").asText();
                if (Objects.equals(name, respondentName)) {
                    String uuid = node.path("additionalDetails").get("uuid").asText();
                    if (uuid != null) {
                        uuids.add(uuid);
                    }
                }
            }
        }

        return uuids;
    }

    public void extractPowerOfAttorneyIds(JsonNode caseDetails, Set<String> individualIds) {
        JsonNode poaHolders = caseDetails.get("poaHolders");
        if (poaHolders != null && poaHolders.isArray()) {
            for (JsonNode poaHolder : poaHolders) {
                String individualId = poaHolder.path("individualId").textValue();
                if (individualId != null && !individualId.isEmpty()) {
                    individualIds.add(individualId);
                }
            }
        }
    }

    private Set<String> callIndividualService(RequestInfo requestInfo, Set<String> ids) {

        Set<String> mobileNumber = new HashSet<>();

        List<Individual> individuals = individualService.getIndividuals(requestInfo, new ArrayList<>(ids));
        for(Individual individual : individuals) {
            if (individual.getMobileNumber() != null) {
                mobileNumber.add(individual.getMobileNumber());
            }
        }
        return mobileNumber;
    }

    private String getMessageCode(String taskType, String status) {

        if (NOTICE.equalsIgnoreCase(taskType) && DELIVERED.equalsIgnoreCase(status)) {
            return NOTICE_DELIVERED;
        }
        if (NOTICE.equalsIgnoreCase(taskType) && RE_ISSUE.equalsIgnoreCase(status)) {
            return NOTICE_NOT_DELIVERED;
        }
        if (SUMMON.equalsIgnoreCase(taskType) && DELIVERED.equalsIgnoreCase(status)) {
            return SUMMONS_DELIVERED;
        }
        if (SUMMON.equalsIgnoreCase(taskType) && RE_ISSUE.equalsIgnoreCase(status)) {
            return SUMMONS_NOT_DELIVERED;
        }
        if (WARRANT.equalsIgnoreCase(taskType) && PENDING_PAYMENT.equalsIgnoreCase(status)) {
            return WARRANT_ISSUED;
        }
        if (WARRANT.equalsIgnoreCase(taskType) && WARRANT_SENT.equalsIgnoreCase(status)) {
            return WARRANT_ISSUE_SUCCESS;
        }
        if (WARRANT.equalsIgnoreCase(taskType) && EXECUTED.equalsIgnoreCase(status)) {
            return WARRANT_DELIVERED;
        }
        if (WARRANT.equalsIgnoreCase(taskType) && NOT_EXECUTED.equalsIgnoreCase(status)) {
            return WARRANT_NOT_DELIVERED;
        }
        return null;
    }

    public void updateTaskDetailsForExistingJoinCaseTasks(HashMap<String, Object> record) {

        try {
            log.info("operation = updateTaskDetailsForJoinCase, result = IN_PROGRESS, record = {}", record);
            CourtCase courtCase = objectMapper.convertValue(record, CourtCase.class);

            String filingNumber = courtCase.getFilingNumber();

            TaskCriteria taskSearchCriteria = TaskCriteria.builder()
                    .filingNumber(filingNumber)
                    .taskType(JOIN_CASE)
                    .status(PENDING_APPROVAL)
                    .build();

            Pagination pagination = Pagination.builder()
                    .offSet(0.0)
                    .limit(50.0)
                    .build();

            List<Task> tasks = taskRepository.getTasks(taskSearchCriteria, pagination);

            updateLitigantNames(courtCase, tasks);

            log.info("operation = updateTaskDetailsForJoinCase, result = SUCCESS, record = {}", record);

        } catch (Exception e) {
            log.info("operation = checkAndScheduleHearingForOptOut, result = FAILURE, message = {}", e.getMessage());
        }

    }

    private void updateLitigantNames(CourtCase courtCase, List<Task> tasks) throws JsonProcessingException {
        for (Task task : tasks) {
            updateLitigantNamesForTask(courtCase, task);
            TaskRequest taskRequest = TaskRequest.builder()
                    .task(task)
                    .requestInfo(RequestInfo.builder().build())
                    .build();
            producer.push(config.getTaskUpdateTopic(), taskRequest);
        }
    }

    private void updateLitigantNamesForTask(CourtCase courtCase, Task task) throws JsonProcessingException {
        JoinCaseTaskRequest joinCaseTaskRequest = objectMapper.convertValue(task.getTaskDetails(), JoinCaseTaskRequest.class);

        List<ReplacementDetails> replacementDetailsList = joinCaseTaskRequest.getReplacementDetails();

        for (ReplacementDetails replacementDetails : replacementDetailsList) {
            updateLitigantName(courtCase, replacementDetails);
            task.setTaskDetails(joinCaseTaskRequest);
        }
    }

    private void updateLitigantName(CourtCase courtCase, ReplacementDetails replacementDetails) throws JsonProcessingException {
        LitigantDetails litigantDetails = replacementDetails.getLitigantDetails();
        String litigantIndividualId = litigantDetails.getIndividualId();

        findMatchingParty(courtCase, litigantIndividualId)
                .ifPresent(matchingParty -> {
                    try {
                        updateLitigantNameFromParty(matchingParty, litigantDetails);
                    } catch (JsonProcessingException e) {
                        // Log error or handle exception as appropriate
                        throw new RuntimeException("Error processing party details", e);
                    }
                });
    }

    private Optional<Party> findMatchingParty(CourtCase courtCase, String litigantIndividualId) {
        return courtCase.getRepresentatives().stream()
                .flatMap(advocateMapping -> advocateMapping.getRepresenting().stream())
                .filter(party -> party.getIndividualId().equalsIgnoreCase(litigantIndividualId))
                .findFirst();
    }

    private void updateLitigantNameFromParty(Party party, LitigantDetails litigantDetails) throws JsonProcessingException {
        JsonNode jsonNode = objectMapper.convertValue(party.getAdditionalDetails(), JsonNode.class);
        String fullName = jsonNode.has("fullName")
                ? jsonNode.get("fullName").textValue()
                : "";

        litigantDetails.setName(fullName);
    }

    public void updateCase(TaskRequest taskRequest) {
        String filingNumber = taskRequest.getTask().getFilingNumber();
        log.info("Updating geolocation details for case: {}", filingNumber);

        try {
            CourtCase courtCase = getCourtCase(taskRequest);
            JsonNode taskDetails = getTaskDetails(taskRequest);
            JsonNode additionalDetails = objectMapper.convertValue(courtCase.getAdditionalDetails(), JsonNode.class);

            Map<String, String> partyToPathMap = Map.of(
                    "respondentDetails", "/respondentDetails/formdata",
                    "witnessDetails", "/witnessDetails/formdata"
            );

            for (Map.Entry<String, String> entry : partyToPathMap.entrySet()) {
                String partyKey = entry.getKey();
                String formDataPath = entry.getValue();

                if (taskDetails.has(partyKey)) {
                    additionalDetails = updateGeoLocationFromTask(additionalDetails, taskDetails, partyKey, formDataPath);
                }
            }


            courtCase.setAdditionalDetails(additionalDetails);
            caseUtil.editCase(taskRequest.getRequestInfo(), courtCase);

            log.info("Successfully updated geolocation details for case: {}", filingNumber);

        } catch (IllegalArgumentException e) {
            log.info("Error updating geolocation details for case: {}", e.getMessage());
            throw new CustomException(ERROR_FROM_CASE, e.getMessage());
        }
    }

    private JsonNode updateGeoLocationFromTask(JsonNode additionalDetails, JsonNode taskDetails, String partyType, String formDataPath) {
        JsonNode address = taskDetails.path(partyType).path("address");
        String addressId = address.path("id").asText();
        JsonNode geoLocation = address.path(GEOLOCATION);

        return updateGeoLocationInAddress(additionalDetails, addressId, geoLocation, formDataPath);
    }



    private CourtCase getCourtCase(TaskRequest taskRequest) {
        List<CourtCase> caseDetails = caseUtil.getCaseDetails(taskRequest);
        if (caseDetails.isEmpty()) {
            throw new IllegalArgumentException("No case found for the given task.");
        }
        return caseDetails.get(0);
    }

    private JsonNode getTaskDetails(TaskRequest taskRequest) {
        return objectMapper.convertValue(taskRequest.getTask().getTaskDetails(), JsonNode.class);
    }
    private JsonNode updateGeoLocationInAddress(JsonNode additionalDetails, String addressDetailId, JsonNode geoLocation, String formDataPath) {
        if (geoLocation != null && geoLocation.isObject()) {
            ((ObjectNode) geoLocation).putNull("latitude");
            ((ObjectNode) geoLocation).putNull("longitude");
        }

        // Get formDataList from additionalDetails using the JSON path
        JsonNode formDataList = additionalDetails.at(formDataPath);

        if (formDataList != null && formDataList.isArray()) {
            for (JsonNode data : formDataList) {
                JsonNode addressDetails = data.path("data").path("addressDetails");
                if (addressDetails.isArray()) {
                    for (JsonNode address : addressDetails) {
                        String addressId = address.path("id").asText();
                        if (addressDetailId.equals(addressId) && address instanceof ObjectNode addressNode) {
                            if (address.has(GEOLOCATION)) {
                                addressNode.replace(GEOLOCATION, geoLocation);
                            } else {
                                addressNode.set(GEOLOCATION, geoLocation);
                            }
                        }
                    }
                }
            }
        }

        return additionalDetails;
    }


}
