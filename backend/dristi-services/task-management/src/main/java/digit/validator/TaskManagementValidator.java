package digit.validator;

import digit.repository.TaskManagementRepository;
import digit.web.models.TaskManagement;
import digit.web.models.TaskManagementRequest;
import digit.web.models.TaskSearchCriteria;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TaskManagementValidator {

    private final TaskManagementRepository taskManagementRepository;

    @Autowired
    public TaskManagementValidator(TaskManagementRepository taskManagementRepository) {
        this.taskManagementRepository = taskManagementRepository;
    }

    public void validateCreateRequest(TaskManagementRequest request) {
    }

    public void validateUpdateRequest(TaskManagementRequest request) {

        if (request.getTaskManagement().getId() == null) {
            throw new CustomException("TASK_MANAGEMENT_ID_NULL_ERROR", "Task management id is null");
        }

        TaskSearchCriteria searchCriteria = TaskSearchCriteria.builder()
                .id(request.getTaskManagement().getId())
                .taskManagementNumber(request.getTaskManagement().getTaskManagementNumber())
                .build();

        List<TaskManagement> taskManagement = taskManagementRepository.getTaskManagement(searchCriteria, null);

        if (taskManagement.isEmpty()) {
            throw new CustomException("TASK_MANAGEMENT_NOT_FOUND_ERROR", "Task management not found");
        }

        if (taskManagement.size() > 1) {
            throw new CustomException("TASK_MANAGEMENT_MULTIPLE_FOUND_ERROR", "Multiple task management found");
        }

    }

}
