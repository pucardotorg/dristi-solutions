package digit.kafka;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.service.PaymentUpdateService;
import digit.service.TaskCreationService;
import digit.service.TaskManagementService;
import digit.service.WorkflowService;
import digit.util.CaseUtil;
import digit.util.DateUtil;
import digit.web.models.*;
import digit.web.models.cases.CourtCase;
import digit.web.models.taskdetails.UpFrontStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.springframework.beans.BeanUtils;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static digit.config.ServiceConstants.*;
import static digit.config.ServiceConstants.SYSTEM_ADMIN;

@Component
@Slf4j
@RequiredArgsConstructor
public class Consumer {

    private final TaskCreationService taskCreationService;
    private final ObjectMapper objectMapper;
    private final CaseUtil caseUtil;
    private final DateUtil dateUtil;
    private final WorkflowService workflowService;
    private final Producer producer;
    private final Configuration configuration;

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
            workflowService.updateWorkflowStatus(TaskManagementRequest.builder()
                    .requestInfo(requestInfo)
                    .taskManagement(taskManagement)
                    .build());

            //add fee paid date to all parties
            addFeePaidDate(taskManagement, requestInfo);
            List<PartyDetails> partyDetails = taskManagement.getPartyDetails();
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

            TaskManagement taskManagementCopy = new TaskManagement();
            BeanUtils.copyProperties(taskManagement, taskManagementCopy); // Shallow copy
            taskManagementCopy.setPartyDetails(partyToUpdate); // Replace with only the filtered parties
            taskCreationService.generateFollowUpTasks(requestInfo, taskManagementCopy);

            //complete task in case all parties are updated
            int size = partyDetails.size();
            int updatedSize = partyToUpdate.size();
            if(size == updatedSize) {
                WorkflowObject workflowObject1 = new WorkflowObject();
                workflowObject1.setAction(COMPLETE_TASK_CREATION);
                taskManagement.setPartyDetails(partyDetails);
                taskManagement.setWorkflow(workflowObject1);
                workflowService.updateWorkflowStatus(TaskManagementRequest.builder()
                        .requestInfo(requestInfo)
                        .taskManagement(taskManagement)
                        .build());
            }
            TaskManagementRequest request = TaskManagementRequest.builder()
                    .requestInfo(requestInfo)
                    .taskManagement(taskManagement)
                    .build();
            producer.push(configuration.getUpdateTaskManagementTopic(), request);
            log.info("Upfront application processed successfully: {}", taskManagement.getTaskManagementNumber());
        } catch (Exception e) {
            log.error("Error processing upfront application: {}", e.getMessage());
        }
    }

    private void addFeePaidDate(TaskManagement taskManagement, RequestInfo requestInfo) {
        CourtCase courtCase = fetchCase(requestInfo, taskManagement.getFilingNumber());
        Long filingDate = courtCase.getFilingDate();
        LocalDate feePaidDate = dateUtil.getLocalDateFromEpoch(filingDate);
        for(PartyDetails partyDetail : taskManagement.getPartyDetails()) {
            partyDetail.getDeliveryChannels().forEach(deliveryChannel -> {
                deliveryChannel.setFeePaidDate(feePaidDate.toString());
            });
        }
    }

    private CourtCase fetchCase(RequestInfo requestInfo, String filingNumber) {
        log.debug("Fetching case details for filing number: {}", filingNumber);

        try {
            JsonNode caseNode = caseUtil.searchCaseDetails(CaseSearchRequest.builder()
                    .requestInfo(requestInfo)
                    .criteria(List.of(CaseCriteria.builder().filingNumber(filingNumber).defaultFields(false).build()))
                    .build());

            if (caseNode == null) {
                log.error("No case found for filing number: {}", filingNumber);
                throw new RuntimeException("Case not found for filing number: " + filingNumber);
            }

            CourtCase courtCase = objectMapper.convertValue(caseNode, CourtCase.class);
            log.debug("Successfully fetched case with ID: {} for filing number: {}",
                    courtCase.getId(), filingNumber);
            return courtCase;
        } catch (Exception e) {
            log.error("Error fetching case for filing number: {}", filingNumber, e);
            throw e;
        }
    }
}
