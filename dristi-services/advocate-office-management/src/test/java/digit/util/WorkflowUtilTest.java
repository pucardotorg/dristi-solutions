package digit.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.config.Configuration;
import digit.repository.ServiceRequestRepository;
import org.egov.common.contract.models.RequestInfoWrapper;
import org.egov.common.contract.models.Workflow;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.common.contract.workflow.*;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static digit.config.ServiceConstants.BUSINESS_SERVICE_NOT_FOUND;
import static digit.config.ServiceConstants.PARSING_ERROR;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class WorkflowUtilTest {

    @Mock
    private ServiceRequestRepository repository;

    @Mock
    private ObjectMapper mapper;

    @Mock
    private Configuration configs;

    @InjectMocks
    private WorkflowUtil workflowUtil;

    private RequestInfo requestInfo;

    @BeforeEach
    void setUp() {
        requestInfo = RequestInfo.builder()
                .apiId("test-api-id")
                .build();

        when(configs.getWfHost()).thenReturn("http://workflow-host");
        when(configs.getWfBusinessServiceSearchPath()).thenReturn("/business-service/search");
        when(configs.getWfTransitionPath()).thenReturn("/process/_transition");
    }

    @Test
    void testGetBusinessService_Success() {
        BusinessService businessService = BusinessService.builder()
                .businessService("ADVOCATE_REGISTRATION")
                .business("advocate")
                .build();

        BusinessServiceResponse businessServiceResponse = BusinessServiceResponse.builder()
                .businessServices(Collections.singletonList(businessService))
                .build();

        when(repository.fetchResult(any(StringBuilder.class), any())).thenReturn(new Object());
        when(mapper.convertValue(any(), eq(BusinessServiceResponse.class))).thenReturn(businessServiceResponse);

        BusinessService result = workflowUtil.getBusinessService(requestInfo, "pg.citya", "ADVOCATE_REGISTRATION");

        assertNotNull(result);
        assertEquals("ADVOCATE_REGISTRATION", result.getBusinessService());
        verify(repository, times(1)).fetchResult(any(StringBuilder.class), any());
    }

    @Test
    void testGetBusinessService_EmptyResponse() {
        BusinessServiceResponse businessServiceResponse = BusinessServiceResponse.builder()
                .businessServices(Collections.emptyList())
                .build();

        when(repository.fetchResult(any(StringBuilder.class), any())).thenReturn(new Object());
        when(mapper.convertValue(any(), eq(BusinessServiceResponse.class))).thenReturn(businessServiceResponse);

        CustomException exception = assertThrows(CustomException.class, () -> workflowUtil.getBusinessService(requestInfo, "pg.citya", "ADVOCATE_REGISTRATION"));

        assertEquals(BUSINESS_SERVICE_NOT_FOUND, exception.getCode());
        assertTrue(exception.getMessage().contains("ADVOCATE_REGISTRATION"));
    }

    @Test
    void testGetBusinessService_ParsingError() {
        when(repository.fetchResult(any(StringBuilder.class), any())).thenReturn(new Object());
        when(mapper.convertValue(any(), eq(BusinessServiceResponse.class)))
                .thenThrow(new IllegalArgumentException("Parsing error"));

        CustomException exception = assertThrows(CustomException.class, () -> workflowUtil.getBusinessService(requestInfo, "pg.citya", "ADVOCATE_REGISTRATION"));

        assertEquals(PARSING_ERROR, exception.getCode());
    }

    @Test
    void testUpdateWorkflowStatus_Success() {
        Workflow workflow = Workflow.builder()
                .action("APPROVE")
                .comments("Approved")
                .build();

        BusinessService businessService = BusinessService.builder()
                .businessService("ADVOCATE_REGISTRATION")
                .build();

        BusinessServiceResponse businessServiceResponse = BusinessServiceResponse.builder()
                .businessServices(Collections.singletonList(businessService))
                .build();

        State state = State.builder()
                .applicationStatus("APPROVED")
                .build();

        ProcessInstance processInstance = ProcessInstance.builder()
                .state(state)
                .build();

        ProcessInstanceResponse processInstanceResponse = ProcessInstanceResponse.builder()
                .processInstances(Collections.singletonList(processInstance))
                .build();

        when(repository.fetchResult(any(StringBuilder.class), any(RequestInfoWrapper.class)))
                .thenReturn(new Object());
        when(mapper.convertValue(any(), eq(BusinessServiceResponse.class)))
                .thenReturn(businessServiceResponse);

        when(repository.fetchResult(any(StringBuilder.class), any(ProcessInstanceRequest.class)))
                .thenReturn(new Object());
        when(mapper.convertValue(any(), eq(ProcessInstanceResponse.class)))
                .thenReturn(processInstanceResponse);

        String result = workflowUtil.updateWorkflowStatus(requestInfo, "pg.citya", "business-123",
                "ADVOCATE_REGISTRATION", workflow, "advocate-module");

        assertEquals("APPROVED", result);
        verify(repository, times(2)).fetchResult(any(StringBuilder.class), any());
    }

    @Test
    void testUpdateWorkflowStatus_WithAssignees() {
        Workflow workflow = Workflow.builder()
                .action("ASSIGN")
                .assignes(Arrays.asList("user-1", "user-2"))
                .build();

        BusinessService businessService = BusinessService.builder()
                .businessService("ADVOCATE_REGISTRATION")
                .build();

        BusinessServiceResponse businessServiceResponse = BusinessServiceResponse.builder()
                .businessServices(Collections.singletonList(businessService))
                .build();

        State state = State.builder()
                .applicationStatus("ASSIGNED")
                .build();

        ProcessInstance processInstance = ProcessInstance.builder()
                .state(state)
                .build();

        ProcessInstanceResponse processInstanceResponse = ProcessInstanceResponse.builder()
                .processInstances(Collections.singletonList(processInstance))
                .build();

        when(repository.fetchResult(any(StringBuilder.class), any(RequestInfoWrapper.class)))
                .thenReturn(new Object());
        when(mapper.convertValue(any(), eq(BusinessServiceResponse.class)))
                .thenReturn(businessServiceResponse);

        when(repository.fetchResult(any(StringBuilder.class), any(ProcessInstanceRequest.class)))
                .thenReturn(new Object());
        when(mapper.convertValue(any(), eq(ProcessInstanceResponse.class)))
                .thenReturn(processInstanceResponse);

        String result = workflowUtil.updateWorkflowStatus(requestInfo, "pg.citya", "business-123",
                "ADVOCATE_REGISTRATION", workflow, "advocate-module");

        assertEquals("ASSIGNED", result);
    }

    @Test
    void testGetWorkflow_Success() {
        User user1 = new User();
        user1.setUuid("user-1");

        User user2 = new User();
        user2.setUuid("user-2");

        ProcessInstance processInstance1 = ProcessInstance.builder()
                .businessId("business-1")
                .action("APPROVE")
                .comment("Approved")
                .assignes(Collections.singletonList(user1))
                .build();

        ProcessInstance processInstance2 = ProcessInstance.builder()
                .businessId("business-2")
                .action("REJECT")
                .comment("Rejected")
                .assignes(Arrays.asList(user1, user2))
                .build();

        List<ProcessInstance> processInstances = Arrays.asList(processInstance1, processInstance2);

        Map<String, Workflow> result = workflowUtil.getWorkflow(processInstances);

        assertNotNull(result);
        assertEquals(2, result.size());
        assertTrue(result.containsKey("business-1"));
        assertTrue(result.containsKey("business-2"));

        Workflow workflow1 = result.get("business-1");
        assertEquals("APPROVE", workflow1.getAction());
        assertEquals("Approved", workflow1.getComments());
        assertEquals(1, workflow1.getAssignes().size());

        Workflow workflow2 = result.get("business-2");
        assertEquals("REJECT", workflow2.getAction());
        assertEquals(2, workflow2.getAssignes().size());
    }

    @Test
    void testGetWorkflow_NoAssignees() {
        ProcessInstance processInstance = ProcessInstance.builder()
                .businessId("business-1")
                .action("APPROVE")
                .comment("Approved")
                .assignes(null)
                .build();

        Map<String, Workflow> result = workflowUtil.getWorkflow(Collections.singletonList(processInstance));

        assertNotNull(result);
        assertEquals(1, result.size());
        assertTrue(result.containsKey("business-1"));

        Workflow workflow = result.get("business-1");
        assertNull(workflow.getAssignes());
    }

    @Test
    void testGetWorkflow_EmptyList() {
        Map<String, Workflow> result = workflowUtil.getWorkflow(Collections.emptyList());

        assertNotNull(result);
        assertTrue(result.isEmpty());
    }

    @Test
    void testGetBusinessService_VerifyUrlConstruction() {
        BusinessService businessService = BusinessService.builder()
                .businessService("TEST_SERVICE")
                .build();

        BusinessServiceResponse businessServiceResponse = BusinessServiceResponse.builder()
                .businessServices(Collections.singletonList(businessService))
                .build();

        when(repository.fetchResult(any(StringBuilder.class), any())).thenReturn(new Object());
        when(mapper.convertValue(any(), eq(BusinessServiceResponse.class))).thenReturn(businessServiceResponse);

        workflowUtil.getBusinessService(requestInfo, "pg.citya", "TEST_SERVICE");

        verify(configs, times(1)).getWfHost();
        verify(configs, times(1)).getWfBusinessServiceSearchPath();
    }
}
