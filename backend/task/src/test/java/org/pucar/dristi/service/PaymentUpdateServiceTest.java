package org.pucar.dristi.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.repository.TaskRepository;
import org.pucar.dristi.util.*;
import org.pucar.dristi.web.models.*;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.pucar.dristi.config.ServiceConstants.*;

@ExtendWith(MockitoExtension.class)
class PaymentUpdateServiceTest {

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private WorkflowUtil workflowUtil;

    @Mock
    private TaskRepository repository;

    @Mock
    private Producer producer;

    @Mock
    private Configuration config;

    @Mock
    private MdmsUtil mdmsUtil;

    @Mock
    private ServiceRequestRepository serviceRequestRepository;

    @Mock
    private CaseUtil caseUtil;

    @Mock
    private AdvocateUtil advocateUtil;

    @Mock
    private PendingTaskUtil pendingTaskUtil;

    @InjectMocks
    private PaymentUpdateService paymentUpdateService;

    private Map<String, Object> record;
    private PaymentRequest paymentRequest;
    private RequestInfo requestInfo;
    private Payment payment;
    private List<PaymentDetail> paymentDetails;
    private String tenantId = "default";
    private String taskNumber = "TSK-001";
    private String consumerCode = "TSK-001_FEE";
    private String businessService = "task-payment";

    @BeforeEach
    void setUp() {
        // Prepare test data
        User user = User.builder()
                .uuid("0068a9a1-20e8-4f20-912f-eb543c2ce6ac")
                .roles(new ArrayList<>()
                ).build();

        requestInfo = RequestInfo.builder()
                .userInfo(user)
                .build();

        // Create Bill
        Bill bill = Bill.builder()
                .consumerCode(consumerCode)
                .businessService(businessService)
                .tenantId(tenantId)
                .status(Bill.StatusEnum.PAID)
                .build();

        // Create PaymentDetail
        PaymentDetail paymentDetail = PaymentDetail.builder()
                .businessService(businessService)
                .bill(bill)
                .build();

        paymentDetails = Collections.singletonList(paymentDetail);

        // Create Payment
        payment = Payment.builder()
                .tenantId(tenantId)
                .paymentDetails(paymentDetails)
                .build();

        // Create PaymentRequest
        paymentRequest = new PaymentRequest(requestInfo, payment);

        // Create record map
        record = new HashMap<>();
    }

    @Test
    void testProcess_shouldTriggerUpdateOfRemainingPendingPaymentTasks() throws JsonProcessingException {
        // Mock ObjectMapper to convert record to PaymentRequest
        when(objectMapper.convertValue(record, PaymentRequest.class)).thenReturn(paymentRequest);

        // Mock Configuration
        when(config.getTaskPaymentBusinessServiceName()).thenReturn(businessService);
        when(config.getSystemAdmin()).thenReturn("SYSTEM_ADMIN");
        when(config.getTaskPaymentBusinessName()).thenReturn("TaskPayment");

        // Mock MdmsUtil
        Map<String, Map<String, JSONArray>> mdmsResponse = new HashMap<>();
        Map<String, JSONArray> moduleData = new HashMap<>();

        // Create mock payment type data
        JSONArray paymentTypeArray = new JSONArray();
        Map<String, Object> paymentType = new HashMap<>();
        paymentType.put("suffix", "FEE");
        paymentType.put("deliveryChannel", "COUNTER");

        List<Map<String, Object>> businessServices = new ArrayList<>();
        Map<String, Object> businessServiceMap = new HashMap<>();
        businessServiceMap.put("businessCode", businessService);
        businessServices.add(businessServiceMap);

        paymentType.put("businessService", businessServices);
        paymentTypeArray.add(paymentType);

        moduleData.put(PAYMENT_TYPE_MASTER_NAME, paymentTypeArray);
        mdmsResponse.put(PAYMENT_MODULE_NAME, moduleData);

        when(mdmsUtil.fetchMdmsData(any(), eq(tenantId), eq(PAYMENT_MODULE_NAME), anyList()))
                .thenReturn(mdmsResponse);

        // Mock filterServiceCode method
        List<Map<String, Object>> filteredServices = Collections.singletonList(paymentType);
        when(objectMapper.readValue(anyString(), any(TypeReference.class))).thenReturn(paymentTypeArray);
        String advocateUuid = "0068a9a1-20e8-4f20-912f-eb543c2ce6ac";
        LinkedHashMap <String, Object> taskDetails = new LinkedHashMap<>();
        taskDetails.put("advocateUuid", advocateUuid);

        // Mock TaskRepository
        Task task = Task.builder()
                .taskNumber(taskNumber)
                .taskType(JOIN_CASE_PAYMENT)
                .taskDetails(taskDetails)
                .build();

        List<Task> tasks = Collections.singletonList(task);
        when(repository.getTasks(any(TaskCriteria.class), isNull())).thenReturn(tasks);

        // Mock WorkflowUtil
        when(workflowUtil.updateWorkflowStatus(
                any(RequestInfo.class),
                eq(tenantId),
                eq(taskNumber),
                eq(businessService),
                any(WorkflowObject.class),
                eq("TaskPayment")))
                .thenReturn("PAYMENT_DONE");

        // For remaining pending tasks
        Task pendingTask = Task.builder()
                .taskNumber("TSK-002")
                .taskType(JOIN_CASE_PAYMENT)
                .status(PENDING_PAYMENT)
                .build();

        List<Task> pendingTasks = Collections.singletonList(pendingTask);
        when(repository.getTasks(argThat(criteria ->
                        PENDING_PAYMENT.equals(criteria.getStatus()) &&
                                JOIN_CASE_PAYMENT.equals(criteria.getTaskType())),
                isNull()))
                .thenReturn(pendingTasks);

        when(workflowUtil.updateWorkflowStatus(
                any(RequestInfo.class),
                eq(tenantId),
                eq("TSK-002"),
                eq(businessService),
                any(WorkflowObject.class),
                eq("TaskPayment")))
                .thenReturn("REJECTED");

        // Execute the method
        paymentUpdateService.process(record);

        // Verify interactions
        verify(objectMapper).convertValue(record, PaymentRequest.class);
        verify(mdmsUtil).fetchMdmsData(eq(requestInfo), eq(tenantId), eq(PAYMENT_MODULE_NAME), anyList());

        // Verify workflow update for the payment task
        verify(workflowUtil).updateWorkflowStatus(
                eq(requestInfo),
                eq(tenantId),
                eq(taskNumber),
                eq(businessService),
                argThat(workflow -> MAKE_PAYMENT.equals(workflow.getAction())),
                eq("TaskPayment"));

        // Verify producer pushed task update
        verify(producer).push(eq(config.getTaskJoinCaseUpdateTopic()), argThat(request ->
                request instanceof TaskRequest &&
                        ((TaskRequest) request).getTask().getTaskNumber().equals(taskNumber)));

        // Verify workflow update for remaining pending payment tasks
        verify(workflowUtil).updateWorkflowStatus(
                eq(requestInfo),
                eq(tenantId),
                eq("TSK-002"),
                eq(businessService),
                argThat(workflow -> REJECT.equals(workflow.getAction())),
                eq("TaskPayment"));

        // Verify producer pushed update for remaining pending tasks
        verify(producer).push(eq(config.getTaskJoinCaseUpdateTopic()), argThat(request ->
                request instanceof TaskRequest &&
                        ((TaskRequest) request).getTask().getTaskNumber().equals("TSK-002")));
    }

    @Test
    void testProcess_exceptionHandling() {
        // Mock ObjectMapper to throw exception
        when(objectMapper.convertValue(record, PaymentRequest.class)).thenThrow(new RuntimeException("Test exception"));

        // Execute the method - should not throw exception
        paymentUpdateService.process(record);

        // Verify no further interactions occurred
        verifyNoMoreInteractions(repository, workflowUtil, producer);
    }
    @Test
    void extractConsumerCode_ReturnsConsumerCode_WhenTaskDetailsContainConsumerCode() {
        Map<String, Object> taskDetails = new HashMap<>();
        taskDetails.put("consumerCode", "CONSUMER_001");
        Task task = Task.builder().taskDetails(taskDetails).build();

        when(objectMapper.convertValue(any(), any(TypeReference.class)))
                .thenReturn(taskDetails);

        String result = paymentUpdateService.extractConsumerCode(task);

        assertNotNull(result);
        assertEquals("CONSUMER_001", result);
    }

    @Test
    void extractConsumerCode_ReturnsNull_WhenTaskDetailsDoNotContainConsumerCode() {
        Map<String, Object> taskDetails = new HashMap<>();
        Task task = Task.builder().taskDetails(taskDetails).build();
        when(objectMapper.convertValue(any(), any(TypeReference.class)))
                .thenReturn(taskDetails);

        String result = paymentUpdateService.extractConsumerCode(task);

        assertNull(result);
    }

    @Test
    void createPendingTaskForRPAD_shouldCallCreatePendingTaskForEnvelope_whenChannelIsRPAD() {
        // Prepare taskDetails with deliveryChannels
        ObjectNode deliveryChannels = new ObjectMapper().createObjectNode();
        deliveryChannels.put("channelCode", "RPAD");

        ObjectNode taskDetails = new ObjectMapper().createObjectNode();
        taskDetails.set("deliveryChannels", deliveryChannels);

        Map<String, Object> taskDetailsMap = new HashMap<>();
        taskDetailsMap.put("deliveryChannels", Map.of("channelCode", "RPAD"));

        Task task = Task.builder()
                .taskDetails(taskDetailsMap)
                .taskNumber("TSK-999")
                .taskType("NOTICE")
                .build();

        when(objectMapper.convertValue(eq(taskDetailsMap), eq(JsonNode.class)))
                .thenReturn(taskDetails);

        List<CourtCase> cases = new ArrayList<>();
        CourtCase courtCase = new CourtCase();
        courtCase.setId(UUID.randomUUID());
        cases.add(courtCase);


        when(caseUtil.getCaseDetails(any(TaskRequest.class))).thenReturn(cases);

        // Spy the service to verify internal method call
        PaymentUpdateService spyService = spy(paymentUpdateService);

        spyService.createPendingTaskForRPAD(task, requestInfo);

        // Verify expected interactions
        verify(objectMapper).convertValue(any(), eq(JsonNode.class));
        verify(caseUtil).getCaseDetails(any(TaskRequest.class));

    }

}
