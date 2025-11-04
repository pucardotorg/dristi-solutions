package digit.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.service.PaymentUpdateService;
import digit.service.TaskCreationService;
import digit.service.TaskManagementService;
import digit.web.models.*;
import digit.web.models.taskdetails.UpFrontStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static digit.config.ServiceConstants.*;
import static digit.config.ServiceConstants.SYSTEM_ADMIN;

@Component
@Slf4j
@RequiredArgsConstructor
public class Consumer {

    private final PaymentUpdateService paymentUpdateService;
    private final TaskCreationService taskCreationService;
    private final TaskManagementService taskManagementService;
    private final ObjectMapper objectMapper;


    @KafkaListener(topics = {"${task.upfront.create.topic}"})
    public void listen(final Map<String, Object> data, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            log.info("Received record: {} on topic: {}", data, topic);
            TaskManagementRequest taskManagementRequest = objectMapper.convertValue(data, TaskManagementRequest.class);
            TaskManagement taskManagement = taskManagementRequest.getTaskManagement();
            RequestInfo requestInfo = taskManagementRequest.getRequestInfo();
            Role role = Role.builder().code(SYSTEM_ADMIN).name(SYSTEM_ADMIN).tenantId(taskManagement.getTenantId()).build();
            requestInfo.getUserInfo().getRoles().add(role);
            processUpfrontApplication(taskManagementRequest.getTaskManagement(), requestInfo);
            log.info("Upfront application processed successfully: {}", taskManagementRequest.getTaskManagement().getTaskManagementNumber());
        } catch (final Exception e) {
            log.error("Error while listening to value: {} on topic: {}: ", data, topic, e);
        }
    }

    public void processUpfrontApplication(TaskManagement taskManagement, RequestInfo requestInfo) {
        try {
            log.info("Processing upfront application: {}", taskManagement.getTaskManagementNumber());
            WorkflowObject workflowObject = new WorkflowObject();
            workflowObject.setAction(UPDATE_UPFRONT_PAYMENT);
            taskManagement.setWorkflow(workflowObject);
            TaskManagement updatedTaskManagement = taskManagementService.updateTaskManagement(TaskManagementRequest.builder()
                    .requestInfo(requestInfo)
                    .taskManagement(taskManagement)
                    .build());
            List<PartyDetails> partyDetails = updatedTaskManagement.getPartyDetails();
            List<PartyDetails> partyToUpdate = new ArrayList<>();
            for(PartyDetails partyDetail : partyDetails) {
                //put condition on IN_PROGRESS party details
                //set upfront status to completed
                //add to partyToUpdate array to create tasks for them
                if (UpFrontStatus.IN_PROGRESS.equals(partyDetail.getStatus())){
                    partyDetail.setStatus(UpFrontStatus.COMPLETED);
                    partyToUpdate.add(partyDetail);
                }
            }
            updatedTaskManagement.setPartyDetails(partyToUpdate);
            taskCreationService.generateFollowUpTasks(requestInfo, updatedTaskManagement);

            //complete task in case all parties are updated
            int size = partyDetails.size();
            int updatedSize = partyToUpdate.size();
            if(size == updatedSize) {
                WorkflowObject workflowObject1 = new WorkflowObject();
                workflowObject1.setAction(COMPLETE_TASK_CREATION);
                updatedTaskManagement.setPartyDetails(partyDetails);
                updatedTaskManagement.setWorkflow(workflowObject1);
                taskManagementService.updateTaskManagement(TaskManagementRequest.builder()
                        .requestInfo(requestInfo)
                        .taskManagement(updatedTaskManagement)
                        .build());
            }
            log.info("Upfront application processed successfully: {}", taskManagement.getTaskManagementNumber());
        } catch (Exception e) {
            log.error("Error processing upfront application: {}", e.getMessage());
        }
    }
}
