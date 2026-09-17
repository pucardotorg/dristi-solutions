package org.pucar.dristi.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.tracer.model.ServiceCallException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.LandingPageCase;
import org.pucar.dristi.web.models.LandingPageCaseListResponse;
import org.egov.common.contract.response.ResponseInfo;
import org.pucar.dristi.web.models.inbox.*;

import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InboxUtilTest {

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private ServiceRequestRepository serviceRequestRepository;

    @Mock
    private Configuration configuration;

    @InjectMocks
    private InboxUtil inboxUtil;

    private InboxRequest mockRequest;
    private InboxResponse mockInboxResponse;
    private Map<String, Object> businessObjectMap;

    @BeforeEach
    void setUp() {
        mockRequest = new InboxRequest();
        mockInboxResponse = new InboxResponse();

        Map<String, Object> caseDetails = new HashMap<>();
        caseDetails.put("caseTitle", "Some Title");
        caseDetails.put("cmpNumber", "1234");
        caseDetails.put("stNumber", "5678");
        caseDetails.put("hearingType", "Final");
        caseDetails.put("nextHearingDate",13214343l);

        businessObjectMap = new HashMap<>();
        businessObjectMap.put("caseDetails", caseDetails);
    }

    @Test
    void testGetLandingPageCaseListResponse_withValidResponse_shouldMapSuccessfully() throws Exception {
        Inbox inbox = new Inbox();
        inbox.setBusinessObject(businessObjectMap);
        mockInboxResponse.setItems(List.of(inbox));
        mockInboxResponse.setResponseInfo(new ResponseInfo());
        mockInboxResponse.setTotalCount(1);

        ObjectMapper realMapper = new ObjectMapper();
        JsonNode jsonNode = realMapper.valueToTree(mockInboxResponse);

        when(configuration.getInboxHost()).thenReturn("http://localhost/");
        when(configuration.getIndexSearchEndPoint()).thenReturn("inbox/search");
        when(serviceRequestRepository.fetchResult(any(), eq(mockRequest))).thenReturn(new Object());
        when(objectMapper.valueToTree(any())).thenReturn(jsonNode);
        when(objectMapper.readValue(anyString(), eq(InboxResponse.class))).thenReturn(mockInboxResponse);

        LandingPageCaseListResponse response = inboxUtil.getLandingPageCaseListResponse(mockRequest);

        assertNotNull(response);
        assertEquals(1, response.getTotalCount());
        assertEquals(1, response.getItems().size());

        LandingPageCase mappedCase = response.getItems().get(0);
        assertEquals("Some Title", mappedCase.getCaseTitle());
        assertEquals("1234", mappedCase.getCmpNumber());
        assertEquals("5678", mappedCase.getStNumber());
        assertEquals("Final", mappedCase.getPurpose());
        assertEquals(13214343l, mappedCase.getNextHearingDate());
    }

    @Test
    void testGetLandingPageCaseListResponse_withEmptyItemsList() throws Exception {
        mockInboxResponse.setItems(Collections.emptyList());
        mockInboxResponse.setTotalCount(0);

        JsonNode jsonNode = new ObjectMapper().valueToTree(mockInboxResponse);

        when(configuration.getInboxHost()).thenReturn("http://localhost/");
        when(configuration.getIndexSearchEndPoint()).thenReturn("inbox/search");
        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(new Object());
        when(objectMapper.valueToTree(any())).thenReturn(jsonNode);
        when(objectMapper.readValue(anyString(), eq(InboxResponse.class))).thenReturn(mockInboxResponse);

        LandingPageCaseListResponse response = inboxUtil.getLandingPageCaseListResponse(mockRequest);

        assertNotNull(response);
        assertEquals(0, response.getTotalCount());
        assertTrue(response.getItems().isEmpty());
    }

    @Test
    void testGetLandingPageCaseListResponse_withNullCaseDetails_shouldIgnore() throws Exception {
        Inbox inbox = new Inbox();
        inbox.setBusinessObject(new HashMap<>());
        mockInboxResponse.setItems(List.of(inbox));
        mockInboxResponse.setResponseInfo(new ResponseInfo());
        mockInboxResponse.setTotalCount(1);

        JsonNode jsonNode = new ObjectMapper().valueToTree(mockInboxResponse);

        when(configuration.getInboxHost()).thenReturn("http://localhost/");
        when(configuration.getIndexSearchEndPoint()).thenReturn("inbox/search");
        when(serviceRequestRepository.fetchResult(any(), eq(mockRequest))).thenReturn(new Object());
        when(objectMapper.valueToTree(any())).thenReturn(jsonNode);
        when(objectMapper.readValue(anyString(), eq(InboxResponse.class))).thenReturn(mockInboxResponse);

        LandingPageCaseListResponse response = inboxUtil.getLandingPageCaseListResponse(mockRequest);

        assertNotNull(response);
        assertTrue(response.getItems().isEmpty());
    }

    @Test
    void testGetLandingPageCaseListResponse_withNullBusinessObject() throws Exception {
        Inbox inbox = new Inbox();
        inbox.setBusinessObject(null);
        mockInboxResponse.setItems(List.of(inbox));
        mockInboxResponse.setTotalCount(1);

        JsonNode jsonNode = new ObjectMapper().valueToTree(mockInboxResponse);

        when(configuration.getInboxHost()).thenReturn("http://localhost/");
        when(configuration.getIndexSearchEndPoint()).thenReturn("inbox/search");
        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(new Object());
        when(objectMapper.valueToTree(any())).thenReturn(jsonNode);
        when(objectMapper.readValue(anyString(), eq(InboxResponse.class))).thenReturn(mockInboxResponse);

        LandingPageCaseListResponse response = inboxUtil.getLandingPageCaseListResponse(mockRequest);

        assertNotNull(response);
        assertEquals(1, response.getTotalCount());
        assertTrue(response.getItems().isEmpty());
    }

    @Test
    void testGetLandingPageCaseListResponse_withInvalidCaseDetailsType() throws Exception {
        Map<String, Object> invalidBusinessObject = new HashMap<>();
        invalidBusinessObject.put("caseDetails", "This should be a map"); // Invalid type

        Inbox inbox = new Inbox();
        inbox.setBusinessObject(invalidBusinessObject);
        mockInboxResponse.setItems(List.of(inbox));
        mockInboxResponse.setTotalCount(1);

        JsonNode jsonNode = new ObjectMapper().valueToTree(mockInboxResponse);

        when(configuration.getInboxHost()).thenReturn("http://localhost/");
        when(configuration.getIndexSearchEndPoint()).thenReturn("inbox/search");
        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(new Object());
        when(objectMapper.valueToTree(any())).thenReturn(jsonNode);
        when(objectMapper.readValue(anyString(), eq(InboxResponse.class))).thenReturn(mockInboxResponse);

        assertThrows(ServiceCallException.class, () -> inboxUtil.getLandingPageCaseListResponse(mockRequest));
    }


    @Test
    void testGetLandingPageCaseListResponse_withJsonProcessingException() throws Exception {
        when(configuration.getInboxHost()).thenReturn("http://localhost/");
        when(configuration.getIndexSearchEndPoint()).thenReturn("inbox/search");
        when(serviceRequestRepository.fetchResult(any(), any())).thenReturn(new Object());
        when(objectMapper.valueToTree(any())).thenReturn(mock(JsonNode.class));
        when(objectMapper.readValue(anyString(), eq(InboxResponse.class)))
                .thenThrow(new JsonProcessingException("Error") {});

        assertThrows(ServiceCallException.class,
                () -> inboxUtil.getLandingPageCaseListResponse(mockRequest));
    }

    @Test
    void testGetLandingPageCaseListResponse_withHttpClientErrorException_shouldThrowServiceCallException() {
        when(configuration.getInboxHost()).thenReturn("http://localhost/");
        when(configuration.getIndexSearchEndPoint()).thenReturn("inbox/search");

        when(serviceRequestRepository.fetchResult(any(), any()))
                .thenThrow(new ServiceCallException(null));

        assertThrows(ServiceCallException.class,
                () -> inboxUtil.getLandingPageCaseListResponse(mockRequest));
    }

    @Test
    void testGetLandingPageCaseListResponse_withGeneralException_shouldThrowRuntimeException() {
        when(configuration.getInboxHost()).thenReturn("http://localhost/");
        when(configuration.getIndexSearchEndPoint()).thenReturn("inbox/search");

        when(serviceRequestRepository.fetchResult(any(), any()))
                .thenThrow(new RuntimeException("Mapping error"));

        RuntimeException thrown = assertThrows(RuntimeException.class,
                () -> inboxUtil.getLandingPageCaseListResponse(mockRequest));

        assertNotNull(thrown.getMessage());
        assertTrue(thrown.getMessage().contains("Mapping error"));
    }

    @Test
    void testMapValuesToLandingPageCase_shouldMapPurposeFieldUsingConfigurableName() throws Exception {
        Map<String, Object> map = new HashMap<>();
        map.put("hearingType", "Cross Examination");

        LandingPageCase landingPageCase = new LandingPageCase();

        Method mapMethod = inboxUtil.getClass().getDeclaredMethod("mapValuesToLandingPageCase", LandingPageCase.class, Map.class);
        mapMethod.setAccessible(true);

        mapMethod.invoke(inboxUtil, landingPageCase, map);

        Field purposeField = LandingPageCase.class.getDeclaredField("purpose");
        purposeField.setAccessible(true);

        assertEquals("Cross Examination", purposeField.get(landingPageCase));
    }

    @Test
    void testMapValuesToLandingPageCase_withUnmappedField() throws Exception {
        Map<String, Object> map = new HashMap<>();
        map.put("nonExistingField", "value");

        LandingPageCase landingPageCase = new LandingPageCase();

        Method mapMethod = inboxUtil.getClass().getDeclaredMethod("mapValuesToLandingPageCase", LandingPageCase.class, Map.class);
        mapMethod.setAccessible(true);
        mapMethod.invoke(inboxUtil, landingPageCase, map);

        // Should not throw exception, unmapped field should be ignored
        assertNull(landingPageCase.getPurpose());
        assertNull(landingPageCase.getCaseTitle());
        assertNull(landingPageCase.getCmpNumber());
        assertNull(landingPageCase.getStNumber());
        assertNull(landingPageCase.getNextHearingDate());
    }

    @Test
    void testConvertValue_withNullValue() throws Exception {
        Method method = InboxUtil.class.getDeclaredMethod("convertValue", Object.class, Class.class);
        method.setAccessible(true);

        Object result = method.invoke(inboxUtil, null, String.class);
        assertNull(result);
    }

    @Test
    void testConvertValue_withUnsupportedType() throws Exception {
        Method method = InboxUtil.class.getDeclaredMethod("convertValue", Object.class, Class.class);
        method.setAccessible(true);

        UUID uuid = UUID.randomUUID();
        Object result = method.invoke(inboxUtil, uuid, UUID.class);
        assertEquals(uuid, result);
    }

    @Test
    void testConvertValue_withConversionFailure() throws Exception {
        Method method = InboxUtil.class.getDeclaredMethod("convertValue", Object.class, Class.class);
        method.setAccessible(true);

        InvocationTargetException ex = assertThrows(InvocationTargetException.class,
                () -> method.invoke(inboxUtil, "abc", Integer.class));
        assertInstanceOf(NumberFormatException.class, ex.getCause());
    }



    @Test
    void testGetInboxRequestForOpenHearing_shouldBuildValidRequest() {
        String tenantId = "pb";
        Long fromDate = 123456789L;
        Long toDate = 987654321L;
        String searchText = "raj";

        InboxRequest request = inboxUtil.getInboxRequestForOpenHearing(tenantId, fromDate, toDate, searchText,false);

        assertNotNull(request);
        assertEquals(tenantId, request.getInbox().getTenantId());
        assertEquals(fromDate, request.getInbox().getModuleSearchCriteria().get("fromDate"));
        assertEquals(toDate, request.getInbox().getModuleSearchCriteria().get("toDate"));
        assertEquals(searchText, request.getInbox().getModuleSearchCriteria().get("searchableFields"));
    }

    @Test
    void testGetInboxRequestForOpenHearing_withNullParameters() {
        InboxRequest request = inboxUtil.getInboxRequestForOpenHearing(null, null, null, null,false);

        assertNotNull(request);
        assertNull(request.getInbox().getTenantId());
        assertNull(request.getInbox().getModuleSearchCriteria().get("fromDate"));
        assertNull(request.getInbox().getModuleSearchCriteria().get("toDate"));
        assertFalse(request.getInbox().getModuleSearchCriteria().containsKey("searchableFields"));
    }

    @Test
    void testGetInboxRequestForOpenHearing_withEmptySearchText() {
        InboxRequest request = inboxUtil.getInboxRequestForOpenHearing("pb", 123L, 456L, "",false);

        assertNotNull(request);
        assertEquals("pb", request.getInbox().getTenantId());
        assertEquals(123L, request.getInbox().getModuleSearchCriteria().get("fromDate"));
        assertEquals(456L, request.getInbox().getModuleSearchCriteria().get("toDate"));
        assertEquals("", request.getInbox().getModuleSearchCriteria().get("searchableFields"));
    }
}
