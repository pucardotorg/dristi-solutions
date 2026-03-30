package digit.service;

import digit.config.Configuration;
import digit.enrichment.TaskManagementEnrichment;
import digit.kafka.Producer;
import digit.repository.TaskManagementRepository;
import digit.validator.TaskManagementValidator;
import digit.web.models.TaskManagement;
import digit.web.models.TaskManagementRequest;
import digit.web.models.TaskSearchRequest;
import digit.web.models.demand.DemandResponse;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

import static digit.config.ServiceConstants.*;


@Service
@Slf4j
public class TaskManagementService {

    private final TaskManagementRepository taskManagementRepository;

    private final WorkflowService workflowService;

    private final DemandService demandService;

    private final TaskManagementValidator validator;

    private final TaskManagementEnrichment enrichment;

    private final Producer producer;

    private final Configuration configuration;

    private final TaskCreationService taskCreationService;

    @Autowired
    public TaskManagementService(TaskManagementRepository taskManagementRepository, WorkflowService workflowService, DemandService demandService, TaskManagementValidator validator, TaskManagementEnrichment enrichment, Producer producer, Configuration configuration, TaskCreationService taskCreationService) {
        this.taskManagementRepository = taskManagementRepository;
        this.workflowService = workflowService;
        this.demandService = demandService;
        this.validator = validator;
        this.enrichment = enrichment;
        this.producer = producer;
        this.configuration = configuration;
        this.taskCreationService = taskCreationService;
    }

    public TaskManagement createTaskManagement(TaskManagementRequest request) {

        try {

            validator.validateCreateRequest(request);

            enrichment.enrichCreateRequest(request);

            if (CREATE.equalsIgnoreCase(request.getTaskManagement().getWorkflow().getAction())) {
                demandService.createDemand(request);
                log.info("demand created successfully");
            }

            workflowService.updateWorkflowStatus(request);

            producer.push(configuration.getSaveTaskManagementTopic(), request);

            return request.getTaskManagement();
        } catch (CustomException e) {
            log.error("Error while creating task management", e);
            throw new CustomException(CREATE_TASK_MANAGEMENT_EXCEPTION, e.getMessage());
        }
    }

    public TaskManagement updateTaskManagement(TaskManagementRequest request) {

        validator.validateUpdateRequest(request);

        enrichment.enrichUpdateRequest(request);

        if (UPDATE.equalsIgnoreCase(request.getTaskManagement().getWorkflow().getAction())) {
            demandService.updateDemand(request);
        }

        if (EXPIRE.equalsIgnoreCase(request.getTaskManagement().getWorkflow().getAction())) {
            log.info("Expire action received for task management : {} ", request.getTaskManagement().getTaskManagementNumber());
            demandService.cancelTaskManagementDemands(request);
            log.info("demand cancelled successfully");
        }

        workflowService.updateWorkflowStatus(request);

        producer.push(configuration.getUpdateTaskManagementTopic(), request);

        return request.getTaskManagement();
    }

    public List<TaskManagement> getTaskManagement(TaskSearchRequest request) {
        return taskManagementRepository.getTaskManagement(request.getCriteria(), request.getPagination());
    }
}
