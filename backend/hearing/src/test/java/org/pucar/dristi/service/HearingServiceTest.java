package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.enrichment.HearingRegistrationEnrichment;
import org.pucar.dristi.kafka.Producer;
import org.pucar.dristi.repository.HearingRepository;
import org.pucar.dristi.util.FileStoreUtil;
import org.pucar.dristi.util.SchedulerUtil;
import org.pucar.dristi.validator.HearingRegistrationValidator;
import org.pucar.dristi.web.models.*;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.pucar.dristi.config.ServiceConstants.HEARING_UPDATE_EXCEPTION;

@ExtendWith(MockitoExtension.class)
public class HearingServiceTest {

    @Mock
    private HearingRegistrationValidator validator;

    @Mock
    private HearingRegistrationEnrichment enrichmentUtil;

    @Mock
    private WorkflowService workflowService;

    @Mock
    private HearingRepository hearingRepository;

    @Mock
    private Producer producer;

    @Mock
    private Configuration config;

    @Mock
    private SchedulerUtil schedulerUtil;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private HearingService hearingServiceMock;

    @Mock
    private FileStoreUtil fileStoreUtil;

    @InjectMocks
    private HearingService hearingService;

    private List<Hearing> hearingList;
    private Hearing hearing;
    private ScheduleHearing scheduleHearing;
    private RequestInfo requestInfo;
    private HearingUpdateBulkRequest hearingUpdateBulkRequest;

    @BeforeEach
    void setUp() {
        hearing = new Hearing();
        hearing.setId(UUID.randomUUID());
        hearing.setHearingId("12345");
        hearing.setStartTime(new Date().getTime());
        hearing.setEndTime(new Date().getTime());

        hearingList = new ArrayList<>();
        hearingList.add(hearing);

        scheduleHearing = new ScheduleHearing();
        scheduleHearing.setHearingBookingId("12345");

        requestInfo = new RequestInfo();
        hearingUpdateBulkRequest = new HearingUpdateBulkRequest();
        hearingUpdateBulkRequest.setHearings(hearingList);
        hearingUpdateBulkRequest.setRequestInfo(requestInfo);
    }

    @Test
    void testCreateHearing_Success() {
        // Arrange
        HearingRequest hearingRequest = new HearingRequest();
        Hearing hearing = new Hearing();
        hearingRequest.setHearing(hearing);

        // Mock validator and enrichmentUtil behaviors
        doNothing().when(validator).validateHearingRegistration(hearingRequest);
        doNothing().when(enrichmentUtil).enrichHearingRegistration(hearingRequest);
        doNothing().when(workflowService).updateWorkflowStatus(hearingRequest);
        when(config.getHearingCreateTopic()).thenReturn("createTopic");

        // Act
        Hearing createdHearing = hearingService.createHearing(hearingRequest);

        // Assert
        assertNotNull(createdHearing);
        assertEquals(hearing, createdHearing);
        verify(producer).push("createTopic", hearingRequest);
    }

    @Test
    void testCreateHearing_CustomException() {
        // Arrange
        HearingRequest hearingRequest = new HearingRequest();

        // Mock validator behavior to throw CustomException
        doThrow(new CustomException("Validation failed","Throw custom exception")).when(validator).validateHearingRegistration(hearingRequest);

        // Act & Assert
        assertThrows(CustomException.class, () -> hearingService.createHearing(hearingRequest));
    }

    @Test
    void testSearchHearing_Success() {
        HearingCriteria criteria = HearingCriteria.builder()
                .hearingId("hearingId")
                .applicationNumber("applicationNumber")
                .cnrNumber("cnrNumber")
                .filingNumber("filingNumber")
                .tenantId("tenantId")
                .fromDate(LocalDate.now().atStartOfDay().toEpochSecond(ZoneOffset.UTC))
                .toDate(LocalDate.now().atStartOfDay().toEpochSecond(ZoneOffset.UTC))
                .build();

        User user = new User();
        RequestInfo requestInfo = new RequestInfo();
        requestInfo.setUserInfo(user);
        HearingSearchRequest request = HearingSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(criteria)
                .build();

        // Arrange
        when(hearingRepository.getHearings(any(HearingSearchRequest.class))).thenReturn(Collections.singletonList(new Hearing()));

        // Act
        List<Hearing> hearingList = hearingService.searchHearing(request);
        // Assert
        assertNotNull(hearingList);
        assertFalse(hearingList.isEmpty());
    }

    @Test
    void testSearchHearing_CustomException() {
        HearingCriteria criteria = HearingCriteria.builder()
                .hearingId("hearingId")
                .applicationNumber("applicationNumber")
                .cnrNumber("cnrNumber")
                .filingNumber("filingNumber")
                .tenantId("tenantId")
                .fromDate(LocalDate.now().atStartOfDay().toEpochSecond(ZoneOffset.UTC))
                .toDate(LocalDate.now().atStartOfDay().toEpochSecond(ZoneOffset.UTC))
                .build();

        User user = new User();
        RequestInfo requestInfo = new RequestInfo();
        requestInfo.setUserInfo(user);
        HearingSearchRequest request = HearingSearchRequest.builder()
                .requestInfo(requestInfo)
                .criteria(criteria)
                .build();
        // Arrange
        when(hearingRepository.getHearings(any(HearingSearchRequest.class)))
                .thenThrow(new CustomException("Search failed","Throw custom exception"));

        // Act & Assert
        assertThrows(CustomException.class, () -> hearingService.searchHearing(request));
    }

    @Test
    void testUpdateHearing_Success() {
        // Arrange
        HearingRequest hearingRequest = new HearingRequest();
        RequestInfo requestInfo = new RequestInfo();
        Hearing hearing = new Hearing();
        hearingRequest.setHearing(hearing);
        hearingRequest.setRequestInfo(requestInfo);

        // Mock validator and workflowService behaviors
        when(validator.validateHearingExistence(requestInfo,hearing)).thenReturn(hearing);
        when(config.getHearingUpdateTopic()).thenReturn("updateTopic");

        // Act
        Hearing updatedHearing = hearingService.updateHearing(hearingRequest);

        // Assert
        assertNotNull(updatedHearing);
        assertEquals(hearing, updatedHearing);
        verify(producer).push("updateTopic", hearingRequest);
    }

    @Test
    void testUpdateHearing_CustomException() {
        // Arrange
        HearingRequest hearingRequest = new HearingRequest();

        // Mock validator behavior to throw CustomException
        when(validator.validateHearingExistence(any(),any())).thenThrow(new CustomException("Hearing not found","throw custom exception"));

        // Act & Assert
        assertThrows(CustomException.class, () -> hearingService.updateHearing(hearingRequest));
    }

    @Test
    void testIsHearingExist_Success() {
        // Arrange
        HearingExistsRequest hearingExistsRequest = new HearingExistsRequest();
        HearingExists hearingExists = new HearingExists();
        hearingExists.setHearingId("HearingId1");
        hearingExistsRequest.setOrder(hearingExists);
        User userInfo = new User();
        userInfo.setTenantId("tenantId");
        RequestInfo requestInfo = new RequestInfo();
        requestInfo.setUserInfo(userInfo);
        hearingExistsRequest.setRequestInfo(requestInfo);
        when(hearingRepository.getHearings(any()))
                .thenReturn(Collections.singletonList(new Hearing()));

        // Act
        HearingExists exists = hearingService.isHearingExist(hearingExistsRequest);

        // Assert
        assertNotNull(exists);
        assertTrue(exists.getExists());
    }

    @Test
    void testIsHearingExist_NotExist() {
        // Arrange
        HearingExistsRequest hearingExistsRequest = new HearingExistsRequest();
        HearingExists hearingExists = new HearingExists();
        hearingExists.setHearingId("HearingId1");
        hearingExistsRequest.setOrder(hearingExists);
        User userInfo = new User();
        userInfo.setTenantId("tenantId");
        RequestInfo requestInfo = new RequestInfo();
        requestInfo.setUserInfo(userInfo);
        hearingExistsRequest.setRequestInfo(requestInfo);
        when(hearingRepository.getHearings(any()))
                .thenReturn(Collections.emptyList());

        // Act
        HearingExists exists = hearingService.isHearingExist(hearingExistsRequest);

        // Assert
        assertNotNull(exists);
        assertFalse(exists.getExists());
    }

    @Test
    void testUpdateTranscriptAdditionalAttendees_Success() {
        // Arrange
        Hearing hearing = new Hearing();
        hearing.setTranscript(Collections.singletonList("old transcript"));
        hearing.setAuditDetails(new AuditDetails());

        Hearing updatedHearing = new Hearing();
        updatedHearing.setTranscript(Collections.singletonList("new transcript"));
        updatedHearing.setAuditDetails(new AuditDetails());

        HearingRequest hearingRequest = new HearingRequest();
        hearingRequest.setRequestInfo(new RequestInfo());
        hearingRequest.setHearing(updatedHearing);

        when(validator.validateHearingExistence(any(RequestInfo.class),any(Hearing.class))).thenReturn(hearing);

        // Act
        Hearing result = hearingService.updateTranscriptAdditionalAttendees(hearingRequest);

        // Assert
        assertNotNull(result);
        assertEquals("new transcript", result.getTranscript().get(0));
        verify(enrichmentUtil, times(1)).enrichHearingApplicationUponUpdate(hearingRequest);
        verify(hearingRepository, times(1)).updateTranscriptAdditionalAttendees(updatedHearing);
        assertEquals(updatedHearing.getAuditDetails(), result.getAuditDetails());
    }

    @Test
    void testUpdateTranscriptAdditionalAttendees_CustomException() {
        // Arrange
        HearingRequest hearingRequest = new HearingRequest();
        hearingRequest.setRequestInfo(new RequestInfo());
        hearingRequest.setHearing(new Hearing());

        when(validator.validateHearingExistence(any(RequestInfo.class),any(Hearing.class)))
                .thenReturn(new Hearing());
        doThrow(new RuntimeException("Unexpected error"))
                .when(hearingRepository).updateTranscriptAdditionalAttendees(any(Hearing.class));

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> hearingService.updateTranscriptAdditionalAttendees(hearingRequest));

        assertEquals(HEARING_UPDATE_EXCEPTION, exception.getCode());
        assertTrue(exception.getMessage().contains("Error occurred while updating hearing: Unexpected error"));
        verify(enrichmentUtil, times(1)).enrichHearingApplicationUponUpdate(hearingRequest);
        verify(hearingRepository, times(1)).updateTranscriptAdditionalAttendees(any(Hearing.class));
    }

    @Test
    void updateTranscriptAdditionalAttendees_ValidationFails() {
        // Arrange
        HearingRequest hearingRequest = new HearingRequest();
        hearingRequest.setRequestInfo(new RequestInfo());
        hearingRequest.setHearing(new Hearing());

        when(validator.validateHearingExistence(any(RequestInfo.class), any(Hearing.class)))
                .thenThrow(new CustomException("VALIDATION_ERROR", "Validation failed"));

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> hearingService.updateTranscriptAdditionalAttendees(hearingRequest));

        assertEquals("VALIDATION_ERROR", exception.getCode());
        assertEquals("Validation failed", exception.getMessage());
        verify(enrichmentUtil, never()).enrichHearingApplicationUponUpdate(any(HearingRequest.class));
        verify(hearingRepository, never()).updateTranscriptAdditionalAttendees(any(Hearing.class));
    }

    @Test
    void updateStartAndTime_success() {
        // Arrange
        UpdateTimeRequest updateTimeRequest = new UpdateTimeRequest();
        RequestInfo requestInfo = new RequestInfo();
        User userInfo = new User();
        userInfo.setUuid("test-user-uuid");
        requestInfo.setUserInfo(userInfo);
        updateTimeRequest.setRequestInfo(requestInfo);

        Hearing hearing = new Hearing();
        hearing.setHearingId("hearing-id");
        hearing.setAuditDetails(new AuditDetails());

        updateTimeRequest.setHearings(List.of
                (hearing));

        Hearing existingHearing = new Hearing();
        existingHearing.setAuditDetails(new AuditDetails());

        when(validator.validateHearingExistence(requestInfo, hearing)).thenReturn(existingHearing);

        // Act
        hearingService.updateStartAndTime(updateTimeRequest);

        // Assert
        assertEquals(userInfo.getUuid(), hearing.getAuditDetails().getLastModifiedBy());
        assertNotNull(hearing.getAuditDetails().getLastModifiedTime());
    }

    @Test
    void updateStartAndTime_missingHearingId() {
        // Arrange
        UpdateTimeRequest updateTimeRequest = new UpdateTimeRequest();
        RequestInfo requestInfo = new RequestInfo();
        User userInfo = new User();
        userInfo.setUuid("test-user-uuid");
        requestInfo.setUserInfo(userInfo);
        updateTimeRequest.setRequestInfo(requestInfo);

        Hearing hearing = new Hearing();
        updateTimeRequest.setHearings(List.of(hearing));

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> hearingService.updateStartAndTime(updateTimeRequest));
        assertEquals("Exception while updating hearing start and end time", exception.getCode());
        assertEquals("Hearing Id is required for updating start and end time", exception.getMessage());

        verify(producer, never()).push(anyString(), any());
    }

    @Test
    void updateStartAndTime_exception() {
        // Arrange
        UpdateTimeRequest updateTimeRequest = new UpdateTimeRequest();
        RequestInfo requestInfo = new RequestInfo();
        User userInfo = new User();
        userInfo.setUuid("test-user-uuid");
        requestInfo.setUserInfo(userInfo);
        updateTimeRequest.setRequestInfo(requestInfo);

        Hearing hearing = new Hearing();
        hearing.setHearingId("hearing-id");
        hearing.setAuditDetails(new AuditDetails());

        updateTimeRequest.setHearings(List.of(hearing));

        when(validator.validateHearingExistence(requestInfo, hearing)).thenThrow(new RuntimeException("Validation failed"));

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> hearingService.updateStartAndTime(updateTimeRequest));
        assertEquals("Exception while updating hearing start and end time", exception.getCode());
        assertEquals("Error occurred while updating hearing start and end time: Validation failed", exception.getMessage());

        verify(producer, never()).push(anyString(), any());
    }

    @Test
    void uploadWitnessDeposition_Success() {
        // Arrange
        HearingRequest hearingRequest = new HearingRequest();
        RequestInfo requestInfo = new RequestInfo();
        User userInfo = new User();
        userInfo.setUuid("test-user-uuid");
        requestInfo.setUserInfo(userInfo);
        hearingRequest.setRequestInfo(requestInfo);
        hearingRequest.setHearing(new Hearing());

        when(validator.validateHearingExistence(requestInfo, hearingRequest.getHearing())).thenReturn(hearingRequest.getHearing());

        // Act
        Hearing result = hearingService.uploadWitnessDeposition(hearingRequest);

        // Assert
        assertNotNull(result);
    }

    @Test
    void uploadWitnessDeposition_CustomException() {
        // Arrange
        HearingRequest hearingRequest = new HearingRequest();
        RequestInfo requestInfo = new RequestInfo();
        User userInfo = new User();
        userInfo.setUuid("test-user-uuid");
        requestInfo.setUserInfo(userInfo);
        hearingRequest.setRequestInfo(requestInfo);
        hearingRequest.setHearing(new Hearing());

        when(validator.validateHearingExistence(requestInfo, hearingRequest.getHearing()))
                .thenThrow(new CustomException("Hearing not found", "throw custom exception"));

        // Act & Assert
        CustomException exception = assertThrows(CustomException.class, () -> hearingService.uploadWitnessDeposition(hearingRequest));
        assertEquals("Hearing not found", exception.getCode());
        assertTrue(exception.getMessage().contains("custom exception"));
    }

//    @Test
//    void testUpdateBulkHearing_Success() {
//        when(hearingRepository.checkHearingsExist(any(Hearing.class))).thenReturn(Collections.singletonList(hearing));
//        when(schedulerUtil.getScheduledHearings(any())).thenReturn(Collections.singletonList(scheduleHearing));
//        when(config.getBulkRescheduleTopic()).thenReturn("test-topic");
//
//        List<Hearing> result = hearingService.updateBulkHearing(hearingUpdateBulkRequest);
//
//        assertNotNull(result);
//        assertEquals(1, result.size());
//        verify(producer, times(1)).push(eq("test-topic"), any(HearingUpdateBulkRequest.class));
//    }

    @Test
    void testUpdateBulkHearing_ExceptionHandling() {
        when(hearingRepository.checkHearingsExist(any(Hearing.class))).thenThrow(new RuntimeException("DB Error"));

        CustomException exception = assertThrows(CustomException.class, () ->
                hearingService.updateBulkHearing(hearingUpdateBulkRequest));

        assertEquals("Error occurred while updating hearing in bulk: DB Error", exception.getMessage());
    }

    @Test
    void testUpdateCaseReferenceHearing_Success_WithCourtCaseNumber() {
        Map<String, Object> body = new HashMap<>();
        body.put("filingNumber", "FN123");
        body.put("courtCaseNumber", "CCN456");
        RequestInfo requestInfo = new RequestInfo();
        body.put("requestInfo", requestInfo);

        Hearing hearing = new Hearing();
        List<Hearing> hearings = Collections.singletonList(hearing);

        when(objectMapper.convertValue(any(), eq(RequestInfo.class))).thenReturn(requestInfo);
        hearingService.updateCaseReferenceHearing(body);

    }

    @Test
    void testUpdateCaseReferenceHearing_ExceptionHandling() {
        Map<String, Object> body = new HashMap<>();
        body.put("filingNumber", "FN123");
        RequestInfo requestInfo = new RequestInfo();
        body.put("requestInfo", requestInfo);

        when(objectMapper.convertValue(any(), eq(RequestInfo.class))).thenReturn(requestInfo);
        when(hearingService.searchHearing(any())).thenThrow(new RuntimeException("Database Error"));

        CustomException thrown = assertThrows(CustomException.class, () -> hearingService.updateCaseReferenceHearing(body));

    }

    @Test
    void testUpdateHearing_filtersInactiveDocumentsAndCallsDependencies() {
        // Arrange
        Hearing existingHearing = new Hearing();
        existingHearing.setStatus("PENDING");

        Document activeDoc = new Document();
        activeDoc.setIsActive(true);
        activeDoc.setFileStore("file-active");

        Document inactiveDoc = new Document();
        inactiveDoc.setIsActive(false);
        inactiveDoc.setFileStore("file-inactive");

        existingHearing.setDocuments(List.of(activeDoc, inactiveDoc));

        WorkflowObject workflow = new WorkflowObject();
        workflow.setAction("APPROVE");

        Hearing incomingHearing = new Hearing();
        incomingHearing.setWorkflow(workflow);
        incomingHearing.setNotes("Some notes");
        incomingHearing.setDocuments(List.of(activeDoc, inactiveDoc));
        incomingHearing.setAdditionalDetails("details");
        incomingHearing.setVcLink("http://vc.link");
        incomingHearing.setCmpNumber("CMP123");
        incomingHearing.setCourtCaseNumber("CCN456");
        incomingHearing.setCaseReferenceNumber("CRN789");
        incomingHearing.setStatus("HEARING_UPDATED");

        RequestInfo requestInfo = new RequestInfo();

        HearingRequest hearingRequest = new HearingRequest();
        hearingRequest.setRequestInfo(requestInfo);
        hearingRequest.setHearing(incomingHearing);

        // Mocks
        when(validator.validateHearingExistence(requestInfo, incomingHearing)).thenReturn(existingHearing);

        when(config.getHearingUpdateTopic()).thenReturn("hearing-update-topic");

        // Act
        Hearing updatedHearing = hearingService.updateHearing(hearingRequest);

        // Assert
        assertNotNull(updatedHearing);
        assertEquals(1, updatedHearing.getDocuments().size());
        assertTrue(updatedHearing.getDocuments().get(0).getIsActive());

    }

}
