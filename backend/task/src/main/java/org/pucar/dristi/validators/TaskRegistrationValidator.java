package org.pucar.dristi.validators;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.common.internals.KafkaFutureImpl;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.repository.TaskRepository;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.OrderUtil;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.ObjectUtils;

import java.util.Collections;
import java.util.List;

import static org.pucar.dristi.config.ServiceConstants.*;

@Component
@Slf4j
public class TaskRegistrationValidator {

    private final TaskRepository repository;
    private final OrderUtil orderUtil;
    private final CaseUtil caseUtil;
    private final ObjectMapper objectMapper;

    @Autowired
    public TaskRegistrationValidator(TaskRepository repository, OrderUtil orderUtil, CaseUtil caseUtil, ObjectMapper objectMapper) {
        this.repository = repository;
        this.orderUtil = orderUtil;
        this.caseUtil = caseUtil;
        this.objectMapper = objectMapper;
    }


    public void validateTaskRegistration(TaskRequest taskRequest) throws CustomException {
        Task task = taskRequest.getTask();
        RequestInfo requestInfo = taskRequest.getRequestInfo();

        if (ObjectUtils.isEmpty(requestInfo.getUserInfo())) {
            throw new CustomException(CREATE_TASK_ERR, "User info is mandatory for creating task");
        }
        List<Role> roles = requestInfo.getUserInfo().getRoles();

        boolean isPendingTaskRole = false;
        for (Role role : roles) {
            isPendingTaskRole = role.getCode().equalsIgnoreCase(PENDING_TASK_CREATOR);
        }

        if (PENDING_TASK.equalsIgnoreCase(task.getTaskType())) {

            JsonNode caseDetails = caseUtil.searchCaseDetails(requestInfo, task.getTenantId(), task.getCnrNumber(), task.getFilingNumber(), null);
            if (caseDetails.isEmpty()) {
                log.error("user is trying to create task which he is not associated, userInfo:{}", requestInfo.getUserInfo());
                throw new CustomException(CREATE_TASK_ERR, "you are not allowed to create task");

            }

        } else {
            if(JOIN_CASE.equalsIgnoreCase(task.getTaskType())){
                return;
            }
            if (isPendingTaskRole) {
                throw new CustomException(CREATE_TASK_ERR, "you are not allowed to create task");
            }
            if (task.getOrderId() == null) {
                throw new CustomException(CREATE_TASK_ERR, "Order ID cannot be null");
            }
            if (!orderUtil.fetchOrderDetails(requestInfo, task.getOrderId())) {
                throw new CustomException(CREATE_TASK_ERR, "Invalid order ID");
            }
        }
    }

    public Boolean validateApplicationExistence(Task task, RequestInfo requestInfo) {

        if (ObjectUtils.isEmpty(requestInfo.getUserInfo())) {
            throw new CustomException(UPDATE_TASK_ERR, "user info is mandatory for creating task");
        }
        TaskExists taskExists = new TaskExists();
        taskExists.setFilingNumber(task.getFilingNumber());
        taskExists.setCnrNumber(task.getCnrNumber());
        taskExists.setTaskId(task.getId());

        return repository.checkTaskExists(taskExists).getExists();
    }

    public Task validateApplicationUploadDocumentExistence(Task task, RequestInfo requestInfo) {

        if (ObjectUtils.isEmpty(requestInfo.getUserInfo())) {
            throw new CustomException(UPLOAD_TASK_DOCUMENT_ERROR, "user info is mandatory for creating task");
        }

        TaskCriteria taskCriteria = TaskCriteria.builder()
                .id(String.valueOf(task.getId()))
                .cnrNumber(task.getCnrNumber())
                .tenantId(task.getTenantId())
                .taskNumber(task.getTaskNumber()).build();

        List<Task> tasks = repository.getTasks(taskCriteria, null);
        if (tasks == null) {
            throw new CustomException(UPLOAD_TASK_DOCUMENT_ERROR, "Tasks list is null");
        }

        return tasks.stream()
                .findFirst()
                .map(existingTask -> {
                    existingTask.setDocuments(task.getDocuments());
                    return existingTask;
                })
                .orElseThrow(() -> new CustomException(UPLOAD_TASK_DOCUMENT_ERROR, "No task found for the given criteria"));

    }

    public void validateJoinCaseTask(TaskRequest taskRequest) throws CustomException {
        RequestInfo requestInfo = taskRequest.getRequestInfo();
        List<Role> roles = requestInfo.getUserInfo().getRoles();
        boolean isJudgeRole = false;

        Task task = taskRequest.getTask();
        JoinCaseTaskRequest joinCaseTaskRequest = objectMapper.convertValue(task.getTaskDetails(), JoinCaseTaskRequest.class);

        // Get case details and validate case existence
        List<CourtCase> courtCaseList = caseUtil.getCaseDetails(taskRequest);
        if (courtCaseList.isEmpty()) {
            throw new CustomException(UPDATE_TASK_ERR, "Case not found");
        }

        CourtCase courtCase = courtCaseList.get(0);
        String userUuid = requestInfo.getUserInfo().getUuid();

        for (Role role : roles) {
            isJudgeRole = role.getCode().equalsIgnoreCase(JUDGE_ROLE);
        }

        List<ReplacementDetails> replacementDetailsList = joinCaseTaskRequest.getReplacementDetails();

        if (!isJudgeRole) {
            // Find replacement details for current user
            replacementDetailsList = Collections.singletonList(findReplacementDetailsForUser(joinCaseTaskRequest, userUuid));
        }

        if (replacementDetailsList == null || replacementDetailsList.isEmpty()) {
            throw new CustomException(UPDATE_TASK_ERR, "You are not allowed to make this change");
        }

        // Validate user authorization based on their role
        for (ReplacementDetails replacementDetails : replacementDetailsList) {
            if (isJudgeRole) {
                userUuid = replacementDetails.getAdvocateDetails().getUserUuid();
            }
            validateUserAuthorization(courtCase, replacementDetails, userUuid);
        }
    }

    private ReplacementDetails findReplacementDetailsForUser(JoinCaseTaskRequest joinCaseTaskRequest, String userUuid) {
        List<ReplacementDetails> replacementDetailsList = joinCaseTaskRequest.getReplacementDetails();
        return replacementDetailsList.stream()
                .filter(rep -> rep.getAdvocateDetails().getUserUuid().equalsIgnoreCase(userUuid))
                .findFirst()
                .orElse(null);
    }

    private void validateUserAuthorization(CourtCase courtCase, ReplacementDetails replacementDetails, String userUuid)
            throws CustomException {
        LitigantDetails litigantDetails = replacementDetails.getLitigantDetails();
        String litigantDetailsIndividualId = litigantDetails.getIndividualId();

        if (replacementDetails.getIsLitigantPip()) {
            validateLitigantAccess(courtCase, litigantDetailsIndividualId);
        } else {
            validateAdvocateAccess(courtCase, userUuid, litigantDetailsIndividualId);
        }
    }

    private void validateLitigantAccess(CourtCase courtCase, String litigantDetailsIndividualId)
            throws CustomException {
        List<Party> litigantList = courtCase.getLitigants();
        Party litigant = litigantList.stream()
                .filter(lit -> lit.getIndividualId().equalsIgnoreCase(litigantDetailsIndividualId))
                .findFirst()
                .orElse(null);

        if (litigant == null || !litigant.getIsActive()) {
            throw new CustomException(PENDNIG_TASK_VALIDATION_ERROR, "You are not allowed to make this change");
        }
    }

    private void validateAdvocateAccess(CourtCase courtCase, String userUuid, String litigantDetailsIndividualId)
            throws CustomException {
        List<AdvocateMapping> advocateMappingList = courtCase.getRepresentatives();
        AdvocateMapping advocateMapping = advocateMappingList.stream()
                .filter(adv -> adv.getAdvocateId().equalsIgnoreCase(userUuid))
                .findFirst()
                .orElse(null);

        if (advocateMapping == null) {
            throw new CustomException(PENDNIG_TASK_VALIDATION_ERROR, "You are not allowed to make this change");
        }

        Party party = advocateMapping.getRepresenting().stream()
                .filter(representing -> representing.getIndividualId().equalsIgnoreCase(litigantDetailsIndividualId))
                .findFirst()
                .orElse(null);

        if (!advocateMapping.getIsActive() || party == null || !party.getIsActive()) {
            throw new CustomException(PENDNIG_TASK_VALIDATION_ERROR, "You are not allowed to make this change");
        }
    }

}