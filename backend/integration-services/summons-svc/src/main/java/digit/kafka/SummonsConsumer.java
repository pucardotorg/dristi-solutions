package digit.kafka;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import digit.service.DemandService;
import digit.service.SummonsService;
import digit.web.models.DeliveryStatus;
import digit.web.models.SummonsRequest;
import digit.web.models.TaskRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.stereotype.Component;

import java.util.HashMap;

import static digit.config.ServiceConstants.*;

@Component
@Slf4j
@EnableAsync
public class SummonsConsumer {

    private final SummonsService summonsService;

    private final ObjectMapper objectMapper;

    private final DemandService demandService;

    @Autowired
    public SummonsConsumer(SummonsService summonsService, ObjectMapper objectMapper, DemandService demandService) {
        this.summonsService = summonsService;
        this.objectMapper = objectMapper;
        this.demandService = demandService;
    }

    @KafkaListener(topics = {"${kafka.topic.save.task.application}"})
    @Async
    public void listenForGenerateSummonsDocument(final HashMap<String, Object> record, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            TaskRequest taskRequest = objectMapper.convertValue(record, TaskRequest.class);
            String taskType = taskRequest.getTask().getTaskType();
            String status = taskRequest.getTask().getStatus();

            // Process for generating summons bill
            boolean isValid = ((taskType.equalsIgnoreCase(SUMMON) || taskType.equalsIgnoreCase(NOTICE) || taskType.equalsIgnoreCase(WARRANT) || taskType.equalsIgnoreCase(PROCLAMATION) || taskType.equalsIgnoreCase(ATTACHMENT))
                    && PENDING_PAYMENT.equalsIgnoreCase(status));
            if (isValid) {
                try {
                    log.info("Received message for bill creation {}", taskRequest.getTask());
                    demandService.fetchPaymentDetailsAndGenerateDemandAndBill(taskRequest);
                } catch (Exception e) {
                    log.error("Error while creating bill: {}", taskRequest.getTask(), e);
                }
            }

            // Process for generating summons document
            if (isValid || (taskRequest.getTask().getWorkflow().getAction().equalsIgnoreCase(CREATE_WITH_OUT_PAYMENT))) {
                try {
                    log.info("Received message for uploading document {}", taskRequest.getTask());
                    summonsService.generateSummonsDocument(taskRequest);
                } catch (Exception e) {
                    log.error("Error while generating summons document: {}", taskRequest.getTask(), e);
                }
            }

            if (taskRequest.getTask().getWorkflow() !=null && taskRequest.getTask().getWorkflow().getAction().equalsIgnoreCase(CREATE) && ISSUE_PROCESS.equalsIgnoreCase(taskRequest.getTask().getStatus())) {
                try {
                    log.info("Received message for uploading document for miscellaneous process{}", taskRequest.getTask());
                    summonsService.generateMiscellaneousDocumentAndUpdateTask(taskRequest,false);
                } catch (Exception e) {
                    log.error("Error while generating miscellaneous process document : {}", taskRequest.getTask(), e);
                }
            }
        } catch (final Exception e) {
            log.error("Error while listening to value: {}: ", record, e);
        }
    }

    @KafkaListener(topics = {"${kafka.topic.update.summons}"})
    @Async
    public void listenForUpdateSummons(final HashMap<String, Object> record, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            SummonsRequest request = objectMapper.convertValue(record, SummonsRequest.class);
            log.info(request.toString());
            if (request.getSummonsDelivery().getDeliveryStatus().equals(DeliveryStatus.DELIVERED)
                    || request.getSummonsDelivery().getDeliveryStatus().equals(DeliveryStatus.NOT_DELIVERED)
                    || request.getSummonsDelivery().getDeliveryStatus().equals(DeliveryStatus.EXECUTED)
                    || request.getSummonsDelivery().getDeliveryStatus().equals(DeliveryStatus.NOT_EXECUTED)
                    || request.getSummonsDelivery().getDeliveryStatus().equals(DeliveryStatus.DELIVERED_ICOPS)
                    || request.getSummonsDelivery().getDeliveryStatus().equals(DeliveryStatus.NOT_DELIVERED_ICOPS)
                    || request.getSummonsDelivery().getDeliveryStatus().equals(DeliveryStatus.IN_TRANSIT)) {
                summonsService.updateTaskStatus(request);
            }
        } catch (final Exception e) {
            log.error("Error while listening to value: {}: ", record, e);
        }
    }

    @KafkaListener(topics = {"${kafka.topic.update.task.application}"})
    @Async
    public void listenForWarrantReissue(final HashMap<String, Object> record, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            TaskRequest taskRequest = objectMapper.convertValue(record, TaskRequest.class);
            String taskType = taskRequest.getTask().getTaskType();
            String action = taskRequest.getTask().getWorkflow() != null
                    ? taskRequest.getTask().getWorkflow().getAction() : null;

            boolean isWarrantReissue = WARRANT.equalsIgnoreCase(taskType)
                    && (WARRANT_REISSUE.equalsIgnoreCase(action) || WARRANT_REISSUE_ICOPS.equalsIgnoreCase(action));

            if (isWarrantReissue) {
                // A WARRANT_REISSUE that lands the warrant back in PENDING_PAYMENT from an already
                // issued/paid state needs a fresh demand + bill, mirroring what the save-task consumer
                // raises for a brand-new warrant. (WARRANT_REISSUE_ICOPS goes to WARRANT_REISSUED, no
                // payment.) A warrant that was already in PENDING_PAYMENT keeps the demand raised at
                // order-publish time, so re-generating would duplicate the litigant's payable bill -
                // skip it by gating on the previousState the task service stamps before the reissue.
                boolean reissueIntoPendingPayment = WARRANT_REISSUE.equalsIgnoreCase(action)
                        && PENDING_PAYMENT.equalsIgnoreCase(taskRequest.getTask().getStatus())
                        && !PENDING_PAYMENT.equalsIgnoreCase(getPreviousState(taskRequest));
                if (reissueIntoPendingPayment) {
                    try {
                        log.info("Generating demand and bill for reissued warrant: taskNumber={}",
                                taskRequest.getTask().getTaskNumber());
                        demandService.fetchPaymentDetailsAndGenerateDemandAndBill(taskRequest);
                    } catch (Exception e) {
                        log.error("Error generating demand for reissued warrant: taskNumber={}",
                                taskRequest.getTask().getTaskNumber(), e);
                    }
                }

                try {
                    log.info("Regenerating warrant PDF for reissue: taskNumber={}, action={}",
                            taskRequest.getTask().getTaskNumber(), action);
                    summonsService.generateSummonsDocument(taskRequest);
                } catch (Exception e) {
                    log.error("Error regenerating warrant PDF for reissue: taskNumber={}",
                            taskRequest.getTask().getTaskNumber(), e);
                }
            }
        } catch (final Exception e) {
            log.error("Error while listening to warrant reissue update: {}: ", record, e);
        }
    }

    @KafkaListener(topics = {"${kafka.topic.issue.summons.application}"})
    @Async
    public void listenForSendSummons(final HashMap<String, Object> record, @Header(KafkaHeaders.RECEIVED_TOPIC) String topic) {
        try {
            TaskRequest taskRequest = objectMapper.convertValue(record, TaskRequest.class);
            log.info("Received message for sending summons {}", taskRequest.getTask());
            summonsService.sendSummonsViaChannels(taskRequest);
        } catch (final Exception e) {
            log.error("Error while listening to value: {}: ", record, e);
        }
    }

    /**
     * Reads the state the warrant was in before the reissue, which the task service stamps into
     * additionalDetails.previousState ahead of the WARRANT_REISSUE workflow transition. Used to tell
     * a fresh move into PENDING_PAYMENT (issued/paid -> PENDING_PAYMENT, demand needed) apart from a
     * PENDING_PAYMENT self-loop (demand already exists). Returns null when it cannot be read.
     */
    private String getPreviousState(TaskRequest taskRequest) {
        try {
            Object additionalDetails = taskRequest.getTask().getAdditionalDetails();
            if (additionalDetails == null) {
                return null;
            }
            JsonNode node = objectMapper.convertValue(additionalDetails, JsonNode.class);
            JsonNode previousState = node.path("previousState");
            return previousState.isMissingNode() || previousState.isNull() ? null : previousState.asText();
        } catch (Exception e) {
            log.warn("Could not read previousState for task: {}", taskRequest.getTask().getTaskNumber());
            return null;
        }
    }
}
