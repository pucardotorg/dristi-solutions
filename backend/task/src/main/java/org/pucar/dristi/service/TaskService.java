package org.pucar.dristi.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.enrichment.TaskRegistrationEnrichment;
import org.pucar.dristi.enrichment.TopicBasedOnStatus;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.TaskRepository;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.WorkflowUtil;
import org.pucar.dristi.validators.TaskRegistrationValidator;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.*;

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

    @Autowired
    public TaskService(TaskRegistrationValidator validator,
                       TaskRegistrationEnrichment enrichmentUtil,
                       TaskRepository taskRepository,
                       WorkflowUtil workflowUtil,
                       Configuration config,
                       Producer producer, CaseUtil caseUtil, ObjectMapper objectMapper, SmsNotificationService notificationService, IndividualService individualService, TopicBasedOnStatus topicBasedOnStatus) {
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
    }

    @Autowired
    public void setValidator(@Lazy TaskRegistrationValidator validator) {
        this.validator = validator;
    }


    public Task createTask(TaskRequest body) {
        try {
            validator.validateTaskRegistration(body);

            enrichmentUtil.enrichTaskRegistration(body);

            workflowUpdate(body);

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
            if (SUMMON_SENT.equalsIgnoreCase(status) || NOTICE_SENT.equalsIgnoreCase(status) || WARRANT_SENT.equalsIgnoreCase(status))
                producer.push(config.getTaskIssueSummonTopic(), body);

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
            return body.getTask();

        } catch (CustomException e) {
            log.error("Custom Exception occurred while updating task :: {}", e.toString());
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while updating task :: {}", e.toString());
            throw new CustomException(UPDATE_TASK_ERR, "Error occurred while updating task: " + e.getMessage());
        }

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

    private void workflowUpdate(TaskRequest taskRequest) {
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
            default -> workflowUtil.updateWorkflowStatus(requestInfo, tenantId, taskNumber,
                    config.getTaskBusinessServiceName(), workflow, config.getTaskBusinessName());
        };

        task.setStatus(status);
    }


    public Task uploadDocument(TaskRequest body) {
        try {
            Task task = validator.validateApplicationUploadDocumentExistence(body.getTask(), body.getRequestInfo());

            // Enrich application upon update
           TaskRequest taskRequest = TaskRequest.builder().requestInfo(body.getRequestInfo()).task(task).build();
            enrichmentUtil.enrichCaseApplicationUponUpdate(taskRequest);

            producer.push(config.getTaskUpdateTopic(), taskRequest);

            return taskRequest.getTask();

        } catch (CustomException e) {
            log.error("Custom Exception occurred while uploading document into task :: {}", e.toString());
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while uploading document into task :: {}", e.toString());
            throw new CustomException(DOCUMENT_UPLOAD_QUERY_EXCEPTION, "Error occurred while uploading document into task: " + e.getMessage());
        }
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

            String accusedName = taskDetails.has("respondentDetails") ? taskDetails.path("respondentDetails").path("name").asText() : "";

            Set<String> individualIds = extractComplainantIndividualIds(caseDetails);
            if (Objects.equals(messageCode, WARRANT_ISSUED)) {
                 accusedName = accusedName.split(" \\(")[0];
                individualIds = extractIndividualIds(caseDetails,accusedName);
            }

            Set<String> phoneNumbers = callIndividualService(taskRequest.getRequestInfo(), individualIds);

            SmsTemplateData smsTemplateData = SmsTemplateData.builder()
                    .courtCaseNumber(caseDetails.has("courtCaseNumber") ? caseDetails.get("courtCaseNumber").asText() : "")
                    .cmpNumber(caseDetails.has("cmpNumber") ? caseDetails.get("cmpNumber").asText() : "")
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
                    .build();

            Pagination pagination = Pagination.builder()
                    .offSet(50.0)
                    .limit(0.0)
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
        }
    }

    private void updateLitigantNamesForTask(CourtCase courtCase, Task task) throws JsonProcessingException {
        JoinCaseTaskRequest joinCaseTaskRequest = objectMapper.convertValue(task.getTaskDetails(), JoinCaseTaskRequest.class);

        List<ReplacementDetails> replacementDetailsList = joinCaseTaskRequest.getReplacementDetails();

        for (ReplacementDetails replacementDetails : replacementDetailsList) {
            updateLitigantName(courtCase, replacementDetails);
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
        JsonNode jsonNode = objectMapper.readTree(party.getAdditionalDetails().toString());
        String fullName = jsonNode.has("fullName")
                ? jsonNode.get("fullName").asText()
                : "";

        litigantDetails.setName(fullName);
    }
}
