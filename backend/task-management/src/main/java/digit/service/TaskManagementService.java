package digit.service;

import digit.config.Configuration;
import digit.kafka.Producer;
import digit.repository.TaskManagementRepository;
import digit.util.WorkflowUtil;
import digit.web.models.TaskManagement;
import digit.web.models.TaskManagementRequest;
import digit.web.models.TaskSearchRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;


@Service
@Slf4j
public class TaskManagementService {

    private final TaskManagementRepository taskManagementRepository;

    private final WorkflowUtil workflowUtil;

    private final Configuration config;

    private final Producer producer;

    @Autowired
    public TaskManagementService(TaskManagementRepository taskManagementRepository, WorkflowUtil workflowUtil, Configuration config, Producer producer) {
        this.taskManagementRepository = taskManagementRepository;
        this.workflowUtil = workflowUtil;
        this.config = config;
        this.producer = producer;
    }

    public TaskManagement createTaskManagement(TaskManagementRequest request) {
        AuditDetails auditDetails = AuditDetails.builder().createdBy(request.getRequestInfo().getUserInfo().getUuid()).createdTime(System.currentTimeMillis()).lastModifiedBy(request.getRequestInfo().getUserInfo().getUuid()).lastModifiedTime(System.currentTimeMillis()).build();
        request.getTaskManagement().setAuditDetails(auditDetails);
        request.getTaskManagement().setId(UUID.randomUUID());

        producer.push("","");
        return request.getTaskManagement();
    }

    public TaskManagement updateTaskManagement(TaskManagementRequest request) {
        request.getTaskManagement().getAuditDetails().setLastModifiedBy(request.getRequestInfo().getUserInfo().getUuid());
        request.getTaskManagement().getAuditDetails().setLastModifiedTime(System.currentTimeMillis());

        if ("COMPLETED".equalsIgnoreCase(request.getTaskManagement().getStatus())) {
            //create tasks
        }
        return request.getTaskManagement();
    }

    public List<TaskManagement> getTaskManagement(TaskSearchRequest request) {
        return taskManagementRepository.getTaskManagement(request.getCriteria(), request.getPagination());
    }
}
