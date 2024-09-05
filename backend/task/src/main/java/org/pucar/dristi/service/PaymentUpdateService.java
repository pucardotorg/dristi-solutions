package org.pucar.dristi.service;


import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.RequestInfoWrapper;
import org.egov.common.contract.models.Workflow;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.repository.TaskRepository;
import org.pucar.dristi.util.WorkflowUtil;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.pucar.dristi.config.ServiceConstants.*;

@Slf4j
@Service
public class PaymentUpdateService {

    private final WorkflowUtil workflowUtil;

    private ObjectMapper mapper;

    private final TaskRepository repository;

    private Producer producer;

    private Configuration config;

    private ServiceRequestRepository serviceRequestRepository;

    @Autowired
    public PaymentUpdateService(WorkflowUtil workflowUtil, ObjectMapper mapper, TaskRepository repository, Producer producer, Configuration config, ServiceRequestRepository serviceRequestRepository) {
        this.workflowUtil = workflowUtil;
        this.mapper = mapper;
        this.repository = repository;
        this.producer = producer;
        this.config = config;
        this.serviceRequestRepository = serviceRequestRepository;
    }

    public void process(Map<String, Object> record) {

        try {

            PaymentRequest paymentRequest = mapper.convertValue(record, PaymentRequest.class);
            RequestInfo requestInfo = paymentRequest.getRequestInfo();

            List<PaymentDetail> paymentDetails = paymentRequest.getPayment().getPaymentDetails();
            String tenantId = paymentRequest.getPayment().getTenantId();

            for (PaymentDetail paymentDetail : paymentDetails) {
                if (paymentDetail.getBusinessService().equalsIgnoreCase(config.getTaskSummonBusinessServiceName())) {
                    updateWorkflowForCasePayment(requestInfo, tenantId, paymentDetail);
                }
            }
        } catch (Exception e) {
            log.error("KAFKA_PROCESS_ERROR:", e);
        }

    }

    private void updateWorkflowForCasePayment(RequestInfo requestInfo, String tenantId, PaymentDetail paymentDetail) {

        try {

            Bill bill = paymentDetail.getBill();
            if (!bill.getStatus().equals(Bill.StatusEnum.PAID)) {
                return;
            }

            String taskNumber = bill.getConsumerCode();
            String suffixToCheck = null;
            String suffixToReplace = null;


            if (taskNumber.endsWith(config.getSummonsEpostFeesSufix())) {
                suffixToCheck = config.getSummonsEpostFeesSufix();
                suffixToReplace = config.getSummonsCourtFeesSufix();
            } else if (taskNumber.endsWith(config.getSummonsCourtFeesSufix())) {
                suffixToCheck = config.getSummonsCourtFeesSufix();
                suffixToReplace = config.getSummonsEpostFeesSufix();
            }

            if (suffixToCheck != null) {
                String taskNumberWithoutSuffix = removeSuffix(taskNumber, suffixToCheck);
                String newTaskNumber = taskNumberWithoutSuffix + suffixToReplace;

                BillResponse billResponse = getBill(requestInfo, bill.getTenantId(), newTaskNumber);
                Bill updatedBill = billResponse.getBill().get(0);

                if (updatedBill.getStatus().equals(Bill.StatusEnum.PAID)) {
                    updatePaymentSuccessWorkflow(requestInfo, tenantId, taskNumberWithoutSuffix);
                }
            } else {
                updatePaymentSuccessWorkflow(requestInfo, tenantId, taskNumber);
            }
        } catch (Exception e) {
            log.error("Error updating workflow for task payment: {}", e.getMessage(), e);
        }
    }
    private String removeSuffix(String taskNumber, String suffix) {
        return taskNumber.substring(0, taskNumber.length() - suffix.length());

    }

    private void updatePaymentSuccessWorkflow(RequestInfo requestInfo, String tenantId, String taskNumber) {
        TaskCriteria criteria = TaskCriteria.builder()
                .taskNumber(taskNumber)
                .build();

        List<Task> tasks = repository.getTasks(criteria ,null);

        if (CollectionUtils.isEmpty(tasks)) {
            throw new CustomException("INVALID_RECEIPT", "No Tasks found for the consumerCode " + criteria.getTaskNumber());
        }

        Role role = Role.builder().code("TASK_UPDATOR").tenantId(tenantId).build();
        requestInfo.getUserInfo().getRoles().add(role);

        for (Task task : tasks) {
            log.info("Updating pending payment status for task: {}", task);
            if (task.getTaskType().equals(SUMMON)) {
                Workflow workflow = new Workflow();
                workflow.setAction("MAKE PAYMENT");
                task.setWorkflow(workflow);
                String status = workflowUtil.updateWorkflowStatus(requestInfo, tenantId, task.getTaskNumber(),
                        config.getTaskSummonBusinessServiceName(), workflow, config.getTaskSummonBusinessName());
                task.setStatus(status);

                TaskRequest taskRequest = TaskRequest.builder().requestInfo(requestInfo).task(task).build();
                if (ISSUESUMMON.equalsIgnoreCase(status))
                    producer.push(config.getTaskIssueSummonTopic(), taskRequest);

                producer.push(config.getTaskUpdateTopic(), taskRequest);
            }
        }
    }

    public BillResponse getBill(RequestInfo requestInfo, String tenantId, String taskNumber) {
        String uri = buildSearchBillURI(tenantId, taskNumber, config.getTaskBusinessService());

        org.egov.common.contract.models.RequestInfoWrapper requestInfoWrapper = RequestInfoWrapper.builder().requestInfo(requestInfo).build();

        Object response = serviceRequestRepository.fetchResult(new StringBuilder(uri), requestInfoWrapper);

        return mapper.convertValue(response, BillResponse.class);
    }

    private String buildSearchBillURI(String tenantId, String applicationNumber, String businessService) {
        try {
            String encodedTenantId = URLEncoder.encode(tenantId, StandardCharsets.UTF_8);
            String encodedApplicationNumber = URLEncoder.encode(applicationNumber, StandardCharsets.UTF_8);
            String encodedBusinessService = URLEncoder.encode(businessService, StandardCharsets.UTF_8);

            return URI.create(String.format("%s%s?tenantId=%s&consumerCode=%s&service=%s",
                    config.getBillingServiceHost(),
                    config.getSearchBillEndpoint(),
                    encodedTenantId,
                    encodedApplicationNumber,
                    encodedBusinessService)).toString();
        } catch (Exception e) {
            log.error("Error occurred when creating bill uri with search params", e);
            throw new CustomException("GENERATE_BILL_ERROR", "Error Occurred when  generating bill");
        }
    }

}