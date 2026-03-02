package org.pucar.dristi.validators;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
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
            if(JOIN_CASE_PAYMENT.equalsIgnoreCase(task.getTaskType())){
                return;
            }
            if(JOIN_CASE.equalsIgnoreCase(task.getTaskType())){
                return;
            }
            if(GENERIC.equals(task.getTaskType())){
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

    public boolean isValidJoinCasePendingTask(TaskRequest body) {
        log.info("operation=isValidJoinCasePendingTask, status=IN_PROGRESS, task request: {}", body);
        Task task = body.getTask();
        JoinCaseTaskRequest joinCaseTaskRequest = objectMapper.convertValue(task.getTaskDetails(), JoinCaseTaskRequest.class);

        CourtCase courtCase = getCourtCase(body);
        AdvocateDetails advocateDetails = joinCaseTaskRequest.getAdvocateDetails();
        List<ReplacementDetails> replacementDetailsList = joinCaseTaskRequest.getReplacementDetails();

        for (ReplacementDetails replacement : replacementDetailsList) {
            // Return false immediately if any replacement is invalid
            if (!isValidReplacement(replacement, courtCase, advocateDetails)) {
                log.info("operation=isValidJoinCasePendingTask, status=FAILURE, task request: {}", body);
                return false;
            }
        }
        log.info("operation=isValidJoinCasePendingTask, status=SUCCESS, task request: {}", body);
        return true;
    }

    // The rest of the methods remain the same
    private CourtCase getCourtCase(TaskRequest body) {
        List<CourtCase> cases = caseUtil.getCaseDetails(body);
        if (cases.isEmpty()) {
            throw new CustomException(UPDATE_TASK_ERR, "case not found");
        }
        return cases.get(0);
    }

    private boolean isValidReplacement(ReplacementDetails replacement, CourtCase courtCase, AdvocateDetails advocateDetails) {
        String litigantId = replacement.getLitigantDetails().getIndividualId();

        if (replacement.getIsLitigantPip()) {
            return isValidPipLitigantReplacement(litigantId, courtCase);
        } else {
            return isValidAdvocateReplacement(replacement, courtCase, advocateDetails);
        }
    }

    private boolean isValidPipLitigantReplacement(String litigantId, CourtCase courtCase) {
        log.info("operation=isValidPipLitigantReplacement, status=IN_PROGRESS, litigantId , courtCase: {} , {}",litigantId,courtCase);
        // Check if litigant exists and is active
        Party litigant = findActiveLitigantById(litigantId, courtCase.getLitigants());
        if (litigant == null) {
            log.info("operation=isValidPipLitigantReplacement, status=FAILURE, litigantId , courtCase: {} , {}",litigantId,courtCase);
            return false;
        }
        // Check if litigant is still self-represented (PIP)
        return isLitigantStillSelfRepresented(litigantId, courtCase.getRepresentatives());
    }

    private Party findActiveLitigantById(String litigantId, List<Party> parties) {
        return parties.stream()
                .filter(party -> party.getIndividualId().equalsIgnoreCase(litigantId) && party.getIsActive())
                .findFirst()
                .orElse(null);
    }

    private boolean isLitigantStillSelfRepresented(String litigantId, List<AdvocateMapping> advocateMappings) {
        log.info("operation=isLitigantStillSelfRepresented, status=IN_PROGRESS, litigantId , advocateMappings: {} , {}",litigantId, advocateMappings);
        for (AdvocateMapping mapping : advocateMappings) {
            Party litigantParty = mapping.getRepresenting().stream()
                    .filter(party -> party.getIndividualId().equalsIgnoreCase(litigantId) && party.getIsActive())
                    .findFirst()
                    .orElse(null);

            // If litigant is actively represented by an advocate, they're not self-represented
            if (litigantParty != null) {
                log.info("operation=isLitigantStillSelfRepresented, status=FAILURE, litigantId , advocateMappings: {} , {}, {}",litigantId, advocateMappings, litigantParty);
                return false;
            }
        }
        log.info("operation=isLitigantStillSelfRepresented, status=SUCCESS, litigantId , advocateMappings: {} ,{}",litigantId, advocateMappings);
        return true;
    }

    private boolean isValidAdvocateReplacement(ReplacementDetails replacement, CourtCase courtCase, AdvocateDetails advocateDetails) {
        log.info("operation=isValidAdvocateReplacement, status=IN_PROGRESS, replacement details , courtCase: {} , {}",replacement,courtCase);
        String newAdvocateId = advocateDetails.getAdvocateId();
        String advocateId = replacement.getAdvocateDetails().getAdvocateUuid();
        String litigantId = replacement.getLitigantDetails().getIndividualId();

        // Check if the advocate exists and is active
        AdvocateMapping advocateMapping = findActiveAdvocateById(advocateId, courtCase.getRepresentatives());
        if (advocateMapping == null) {
            log.info("operation=isValidAdvocateReplacement, status=FAILURE, replacement details , courtCase: {} , {}",replacement,courtCase);
            return false;
        }

        // Check if the advocate is representing the specified litigant and the litigant is active
        if (!isAdvocateRepresentingActiveLitigant(advocateMapping, litigantId)) {
            log.info("operation=isValidAdvocateReplacement, status=FAILURE, replacement details , courtCase, advocateMapping: {} , {}, {}",replacement,courtCase, advocateMapping);
            return false;
        }

        // Check if the replacement advocate is already representing the litigant in another task
        return !isAdvocateAlreadyRepresentingLitigant(newAdvocateId, litigantId, courtCase.getRepresentatives());
    }

    private AdvocateMapping findActiveAdvocateById(String advocateId, List<AdvocateMapping> advocateMappings) {
        return advocateMappings.stream()
                .filter(mapping -> mapping.getAdvocateId().equalsIgnoreCase(advocateId) && mapping.getIsActive())
                .findFirst()
                .orElse(null);
    }

    private boolean isAdvocateRepresentingActiveLitigant(AdvocateMapping advocateMapping, String litigantId) {
        return advocateMapping.getRepresenting().stream()
                .anyMatch(party -> party.getIndividualId().equalsIgnoreCase(litigantId) && party.getIsActive());
    }

    private boolean isAdvocateAlreadyRepresentingLitigant(String advocateId, String litigantId, List<AdvocateMapping> advocateMappings) {
        for (AdvocateMapping mapping : advocateMappings) {
            if (mapping.getAdvocateId().equalsIgnoreCase(advocateId)) {
                Party litigantParty = mapping.getRepresenting().stream()
                        .filter(party -> party.getIndividualId().equalsIgnoreCase(litigantId) && party.getIsActive())
                        .findFirst()
                        .orElse(null);

                if (litigantParty != null) {
                    log.info("operation=isAdvocateAlreadyRepresentingLitigant, status=SUCCESS, advocateId, litigantId , {} , {}",advocateId, litigantId);
                    return true;
                }
            }
        }
        log.info("operation=isAdvocateAlreadyRepresentingLitigant, status=FAILURE, advocateId, litigantId , {} , {}",advocateId, litigantId);
        return false;
    }
}