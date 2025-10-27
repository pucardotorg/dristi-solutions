package digit.service;

import digit.web.models.TaskManagement;
import digit.web.models.TaskManagementRequest;
import digit.web.models.TaskSearchRequest;
import digit.web.models.WorkflowObject;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import digit.config.Configuration;
import digit.repository.TaskManagementRepository;

import java.util.List;
import java.util.UUID;


@Service
@Slf4j
public class TaskManagementService {

    @Autowired
    private TaskManagementRepository taskManagementRepository;

    @Autowired
    private WorkflowUtil workflowUtil;

    @Autowired
    private Configuration config;

    public TaskManagementService(TaskManagementRepository taskManagementRepository, WorkflowUtil workflowUtil, Configuration config){
        this.taskManagementRepository = taskManagementRepository;
       this.workflowUtil = workflowUtil;
       this.config = config;
    }

    public TaskManagement createTaskManagement(TaskManagementRequest request) {
        AuditDetails auditDetails = AuditDetails.builder().createdBy(request.getRequestInfo().getUserInfo().getUuid()).createdTime(System.currentTimeMillis()).lastModifiedBy(request.getRequestInfo().getUserInfo().getUuid()).lastModifiedTime(System.currentTimeMillis()).build();
        request.getTaskManagement().setAuditDetails(auditDetails);
        request.getTaskManagement().setId(UUID.randomUUID());

        workflowUpdate(request);

        return request.getTaskManagement();
    }

    public TaskManagement updateTaskManagement(TaskManagementRequest request) {
        request.getTaskManagement().getAuditDetails().setLastModifiedBy(request.getRequestInfo().getUserInfo().getUuid());
        request.getTaskManagement().getAuditDetails().setLastModifiedTime(System.currentTimeMillis());

        workflowUpdate(request);

        if("COMPLETED".equalsIgnoreCase(request.getTaskManagement().getStatus())){
            //create tasks
        }
        return request.getTaskManagement();
    }

    private void workflowUpdate(TaskManagementRequest request) {
        TaskManagement taskManagement = request.getTaskManagement();
        String tenantId = taskManagement.getTenantId();
        String id = String.valueOf(taskManagement.getId());
        WorkflowObject workflow = taskManagement.getWorkflow();

        String status = workflowUtil.updateWorkflowStatus(request.getRequestInfo(), tenantId, id, config.getTaskBusinessServiceName(),
                workflow, config.getTaskBusinessName());
        taskManagement.setStatus(status);
    }

    public List<TaskManagement> getTaskManagement(TaskSearchRequest request) {
        return taskManagementRepository.getTaskManagement(request.getCriteria(), request.getPagination());
    }
}
