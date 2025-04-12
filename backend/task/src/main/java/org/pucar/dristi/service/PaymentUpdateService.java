package org.pucar.dristi.service;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import lombok.extern.slf4j.Slf4j;
import net.minidev.json.JSONArray;
import org.egov.common.contract.models.RequestInfoWrapper;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.repository.TaskRepository;
import org.pucar.dristi.util.DemandUtil;
import org.pucar.dristi.util.MdmsUtil;
import org.pucar.dristi.util.WorkflowUtil;
import org.pucar.dristi.web.models.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

import static org.pucar.dristi.config.ServiceConstants.*;

@Slf4j
@Service
public class PaymentUpdateService {

    private final WorkflowUtil workflowUtil;
    private final ObjectMapper mapper;
    private final TaskRepository repository;
    private final Producer producer;
    private final Configuration config;
    private final MdmsUtil mdmsUtil;
    private final ObjectMapper objectMapper;
    private final DemandUtil demandUtil;

    private ServiceRequestRepository serviceRequestRepository;

    @Autowired
    public PaymentUpdateService(WorkflowUtil workflowUtil, ObjectMapper mapper, TaskRepository repository, Producer producer, Configuration config, MdmsUtil mdmsUtil, ObjectMapper objectMapper, ServiceRequestRepository serviceRequestRepository, DemandUtil demandUtil) {
        this.workflowUtil = workflowUtil;
        this.mapper = mapper;
        this.repository = repository;
        this.producer = producer;
        this.config = config;
        this.mdmsUtil = mdmsUtil;
        this.objectMapper = objectMapper;
        this.serviceRequestRepository = serviceRequestRepository;
        this.demandUtil = demandUtil;
    }

    public void process(Map<String, Object> record) {

        try {

            PaymentRequest paymentRequest = mapper.convertValue(record, PaymentRequest.class);
            RequestInfo requestInfo = paymentRequest.getRequestInfo();

            List<PaymentDetail> paymentDetails = paymentRequest.getPayment().getPaymentDetails();
            String tenantId = paymentRequest.getPayment().getTenantId();

            for (PaymentDetail paymentDetail : paymentDetails) {
                if (paymentDetail.getBusinessService().equalsIgnoreCase(config.getTaskPaymentBusinessServiceName()) || paymentDetail.getBusinessService().equalsIgnoreCase(config.getTaskSummonBusinessServiceName()) || paymentDetail.getBusinessService().equalsIgnoreCase(config.getTaskNoticeBusinessServiceName()) || paymentDetail.getBusinessService().equalsIgnoreCase(config.getTaskWarrantBusinessServiceName())) {
                    updateWorkflowForTaskPayment(requestInfo, tenantId, paymentDetail);
                }
            }
        } catch (Exception e) {
            log.error("KAFKA_PROCESS_ERROR:", e);
        }

    }

    private void updateWorkflowForTaskPayment(RequestInfo requestInfo, String tenantId, PaymentDetail paymentDetail) {

        try {

            Bill bill = paymentDetail.getBill();
            String consumerCode = bill.getConsumerCode();
            String businessService = bill.getBusinessService();
            String[] consumerCodeSplitArray = consumerCode.split("_", 2);
            String taskNumber = consumerCodeSplitArray[0];
            String suffix = consumerCodeSplitArray[1];

            JSONArray paymentType = mdmsUtil.fetchMdmsData(requestInfo, tenantId, PAYMENT_MODULE_NAME, List.of(PAYMENT_TYPE_MASTER_NAME))
                    .get(PAYMENT_MODULE_NAME).get(PAYMENT_TYPE_MASTER_NAME);

            String filterString = String.format(FILTER_PAYMENT_TYPE, suffix, businessService);

            JSONArray paymentMaster = JsonPath.read(paymentType, filterString);

            List<String> deliveryChannels = JsonPath.read(paymentMaster, "$..deliveryChannel");

            //todo:handle error
            String filterStringDeliveryChannel = String.format(FILTER_PAYMENT_TYPE_DELIVERY_CHANNEL, deliveryChannels.get(0), businessService);

            JSONArray paymentMasterWithDeliveryChannel = JsonPath.read(paymentType, filterStringDeliveryChannel);
            List<Map<String, Object>> maps = filterServiceCode(paymentMasterWithDeliveryChannel, businessService);

            int paymentCountForDeliveryChannel = maps.size();

            if (paymentCountForDeliveryChannel > 1) {

                List<String> suffixes = JsonPath.read(paymentMasterWithDeliveryChannel, "$..suffix");
                Set<String> consumerCodeSet = new HashSet<>();
                for (String element : suffixes) {
                    if (!element.equalsIgnoreCase(suffix)) {
                        String newConsumerCode = taskNumber + "_" + element;
                        consumerCodeSet.add(newConsumerCode);
                    }
                }
                BillResponse billResponse = getBill(requestInfo, bill.getTenantId(), consumerCodeSet, businessService);
                List<Bill> partsBill = billResponse.getBill();
                boolean canUpdateWorkflow = !partsBill.isEmpty();
                for (Bill element : partsBill) {
                    if (!element.getStatus().equals(Bill.StatusEnum.PAID)) {
                        canUpdateWorkflow = false;
                        break;
                    }
                }
                if (canUpdateWorkflow) {
                    updatePaymentSuccessWorkflow(requestInfo, tenantId, taskNumber);
                }
            } else {
                updatePaymentSuccessWorkflow(requestInfo, tenantId, taskNumber);
            }

        } catch (Exception e) {
            log.error("Error updating workflow for task payment: {}", e.getMessage(), e);
        }
    }

    private void updatePaymentSuccessWorkflow(RequestInfo requestInfo, String tenantId, String taskNumber) {
        TaskCriteria criteria = TaskCriteria.builder()
                .taskNumber(taskNumber)
                .build();

        List<Task> tasks = repository.getTasks(criteria, null);

        if (CollectionUtils.isEmpty(tasks)) {
            throw new CustomException("INVALID_RECEIPT", "No Tasks found for the consumerCode " + criteria.getTaskNumber());
        }

        Role role = Role.builder().code(config.getSystemAdmin()).tenantId(tenantId).build();
        requestInfo.getUserInfo().getRoles().add(role);

        for (Task task : tasks) {
            log.info("Updating pending payment status for task: {}", task);
            switch (task.getTaskType()) {
                case SUMMON -> {
                    WorkflowObject workflow = new WorkflowObject();
                    workflow.setAction(MAKE_PAYMENT);
                    task.setWorkflow(workflow);
                    String status = workflowUtil.updateWorkflowStatus(requestInfo, tenantId, task.getTaskNumber(),
                            config.getTaskSummonBusinessServiceName(), workflow, config.getTaskSummonBusinessName());
                    task.setStatus(status);

                    TaskRequest taskRequest = TaskRequest.builder().requestInfo(requestInfo).task(task).build();
                    producer.push(config.getTaskUpdateTopic(), taskRequest);
                }
                case NOTICE -> {
                    WorkflowObject workflow = new WorkflowObject();
                    workflow.setAction(MAKE_PAYMENT);
                    task.setWorkflow(workflow);
                    String status = workflowUtil.updateWorkflowStatus(requestInfo, tenantId, task.getTaskNumber(),
                            config.getTaskNoticeBusinessServiceName(), workflow, config.getTaskNoticeBusinessName());
                    task.setStatus(status);

                    TaskRequest taskRequest = TaskRequest.builder().requestInfo(requestInfo).task(task).build();
                    producer.push(config.getTaskUpdateTopic(), taskRequest);
                }
                case WARRANT -> {
                    WorkflowObject workflow = new WorkflowObject();
                    workflow.setAction(MAKE_PAYMENT);
                    task.setWorkflow(workflow);
                    String status = workflowUtil.updateWorkflowStatus(requestInfo, tenantId, task.getTaskNumber(),
                            config.getTaskWarrantBusinessServiceName(), workflow, config.getTaskWarrantBusinessName());
                    task.setStatus(status);

                    TaskRequest taskRequest = TaskRequest.builder().requestInfo(requestInfo).task(task).build();
                    producer.push(config.getTaskUpdateTopic(), taskRequest);
                }
                case JOIN_CASE_PAYMENT -> {
                    WorkflowObject  workflow = new WorkflowObject();
                    workflow.setAction(MAKE_PAYMENT);
                    task.setWorkflow(workflow);

                    String status = workflowUtil.updateWorkflowStatus(requestInfo, tenantId, task.getTaskNumber(),
                            config.getTaskPaymentBusinessServiceName(), workflow, config.getTaskPaymentBusinessName());
                    task.setStatus(status);

                    TaskRequest taskRequest = TaskRequest.builder().requestInfo(requestInfo).task(task).build();
                    producer.push(config.getTaskUpdateTopic(), taskRequest);

                    // update remaining pending task of payment's of the advocate

                    updatePaymentStatusOfRemainingPendingPaymentTasks(taskRequest, tenantId, task.getFilingNumber());

                }
            }
        }
    }

    public BillResponse getBill(RequestInfo requestInfo, String tenantId, Set<String> consumerCodes, String businessService) {
        String uri = buildSearchBillURI(tenantId, consumerCodes, businessService);

        org.egov.common.contract.models.RequestInfoWrapper requestInfoWrapper = RequestInfoWrapper.builder().requestInfo(requestInfo).build();

        Object response = serviceRequestRepository.fetchResult(new StringBuilder(uri), requestInfoWrapper);

        return mapper.convertValue(response, BillResponse.class);
    }

    private String buildSearchBillURI(String tenantId, Set<String> consumerCode, String businessService) {
        try {
            String encodedTenantId = URLEncoder.encode(tenantId, StandardCharsets.UTF_8);
            String encodedBusinessService = URLEncoder.encode(businessService, StandardCharsets.UTF_8);

            // Convert Set to String
            String consumerCodeStr = String.join(",", consumerCode);
            String encodedConsumerCode = URLEncoder.encode(consumerCodeStr, StandardCharsets.UTF_8);

            return URI.create(String.format("%s%s?tenantId=%s&consumerCode=%s&service=%s",
                    config.getBillingServiceHost(),
                    config.getSearchBillEndpoint(),
                    encodedTenantId,
                    encodedConsumerCode,
                    encodedBusinessService)).toString();
        } catch (Exception e) {
            log.error("Error occurred when creating bill uri with search params", e);
            throw new CustomException("GENERATE_BILL_ERROR", "Error Occurred when  generating bill");
        }
    }

    public List<Map<String, Object>> filterServiceCode(JSONArray paymentMasterWithDeliveryChannel, String serviceCode) throws JsonProcessingException {


        String jsonString = paymentMasterWithDeliveryChannel.toString();
        List<Map<String, Object>> jsonList = objectMapper.readValue(jsonString, new TypeReference<>() {
        });

        return jsonList.stream()
                .filter(item ->
                        ((List<Map<String, Object>>) item.get("businessService")).stream()
                                .anyMatch(service -> serviceCode.equals(service.get("businessCode")))
                )
                .toList();


    }

    private void updatePaymentStatusOfRemainingPendingPaymentTasks(TaskRequest taskRequestResponse, String tenantId, String filingNumber) {

        Task taskResponse = taskRequestResponse.getTask();

        RequestInfo requestInfo = taskRequestResponse.getRequestInfo();

        LinkedHashMap taskDetailsMap = ((LinkedHashMap) taskResponse.getTaskDetails());

        String advocateUuid = taskDetailsMap.get("advocateUuid").toString();

        TaskCriteria criteria = TaskCriteria.builder()
                .userUuid(advocateUuid)
                .status(PENDING_PAYMENT)
                .filingNumber(filingNumber)
                .taskType(JOIN_CASE_PAYMENT)
                .build();

        List<Task> tasks = repository.getTasks(criteria, null);

        if (CollectionUtils.isEmpty(tasks)) {
            log.info("No other pending payment task's found for advocate :: {}", advocateUuid);
            return;
        }
        String paidTaskNumber = taskResponse.getTaskNumber();
        tasks = tasks.stream().filter(task -> !task.getTaskNumber().equalsIgnoreCase(paidTaskNumber)).collect(Collectors.toList());

        tasks.forEach(task -> {

                WorkflowObject workflow = new WorkflowObject();
                workflow.setAction(REJECT);
                task.setWorkflow(workflow);
                String status = workflowUtil.updateWorkflowStatus(requestInfo, tenantId, task.getTaskNumber(),
                        config.getTaskPaymentBusinessServiceName(), workflow, config.getTaskPaymentBusinessName());
                log.info("Rejecting remaining pending payment task for advocate by system :: {}", advocateUuid);
                task.setStatus(status);

                TaskRequest taskRequest = TaskRequest.builder().requestInfo(requestInfo).task(task).build();
                producer.push(config.getTaskUpdateTopic(), taskRequest);
        });
        searchAndCancelTaskRelatedDemands(tenantId, tasks, requestInfo);
    }

    private void searchAndCancelTaskRelatedDemands(String tenantId, List<Task> tasks, RequestInfo requestInfo) {
        Set<String> consumerCodes = tasks.stream().map(this::extractConsumerCode).collect(Collectors.toSet());
        DemandCriteria demandCriteria = new DemandCriteria();
        demandCriteria.setConsumerCode(consumerCodes);
        demandCriteria.setTenantId(tenantId);
        RequestInfoWrapper requestInfoWrapper = new RequestInfoWrapper();
        requestInfoWrapper.setRequestInfo(requestInfo);
        DemandResponse demandResponse = demandUtil.searchDemand(demandCriteria, requestInfoWrapper);
        if (demandResponse != null && !CollectionUtils.isEmpty(demandResponse.getDemands())) {
            for (Demand demand : demandResponse.getDemands()) {
                demand.setStatus(Demand.StatusEnum.CANCELLED);
                }
            DemandRequest demandRequest = new DemandRequest();
            demandRequest.setRequestInfo(requestInfo);
            demandRequest.setDemands(demandResponse.getDemands());
            DemandResponse updatedDemandResponse = demandUtil.updateDemand(demandRequest);
            log.info("Updating demand status to cancelled for consumer codes :: {}", consumerCodes);
            }
    }


    public String extractConsumerCode(Task task) {
        Object taskDetails = task.getTaskDetails();
        Map<String, Object> taskDetailsMap = mapper.convertValue(taskDetails, new TypeReference<>() {
        });
        return (String) taskDetailsMap.get("consumerCode");
    }
}
