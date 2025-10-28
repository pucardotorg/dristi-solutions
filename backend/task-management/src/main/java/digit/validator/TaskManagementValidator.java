package digit.validator;

import digit.repository.TaskManagementRepository;
import digit.web.models.TaskManagementRequest;
import digit.web.models.TaskSearchCriteria;
import digit.web.models.TaskSearchRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

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

        TaskSearchCriteria searchCriteria = TaskSearchCriteria.builder()
                .id(request.getTaskManagement().getId())
                .build();

        taskManagementRepository.getTaskManagement(searchCriteria, null);

    }

}
