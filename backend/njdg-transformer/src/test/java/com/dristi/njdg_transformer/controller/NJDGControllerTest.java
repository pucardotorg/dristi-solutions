package com.dristi.njdg_transformer.controller;

import com.dristi.njdg_transformer.model.*;
import com.dristi.njdg_transformer.model.advocate.Advocate;
import com.dristi.njdg_transformer.model.advocate.AdvocateRequest;
import com.dristi.njdg_transformer.model.cases.CaseRequest;
import com.dristi.njdg_transformer.model.cases.CaseResponse;
import com.dristi.njdg_transformer.model.cases.CourtCase;
import com.dristi.njdg_transformer.model.hearing.Hearing;
import com.dristi.njdg_transformer.model.hearing.HearingRequest;
import com.dristi.njdg_transformer.model.order.Notification;
import com.dristi.njdg_transformer.model.order.NotificationRequest;
import com.dristi.njdg_transformer.model.order.Order;
import com.dristi.njdg_transformer.model.order.OrderRequest;
import com.dristi.njdg_transformer.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.common.contract.request.RequestInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Collections;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NJDGControllerTest {

    @Mock
    private CaseService caseService;

    @Mock
    private OrderService orderService;

    @Mock
    private HearingService hearingService;

    @Mock
    private AdvocateService advocateService;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private OrderNotificationService orderNotificationService;

    @InjectMocks
    private NJDGController njdgController;

    private CaseRequest caseRequest;
    private CourtCase courtCase;
    private RequestInfo requestInfo;
    private NJDGTransformRecord njdgRecord;

    @BeforeEach
    void setUp() {
        courtCase = new CourtCase();
        courtCase.setCnrNumber("CNR-001");
        courtCase.setFilingNumber("FN-001");

        caseRequest = new CaseRequest();
        caseRequest.setCourtCase(courtCase);
        caseRequest.setRequestInfo(RequestInfo.builder().build());

        requestInfo = RequestInfo.builder().build();

        njdgRecord = new NJDGTransformRecord();
        njdgRecord.setCino("CNR-001");
    }

    @Test
    void testProcessAndUpsertCase_Success() {
        when(caseService.processAndUpdateCase(any(CourtCase.class), any(RequestInfo.class)))
                .thenReturn(njdgRecord);

        ResponseEntity<CaseResponse> response = njdgController.processAndUpsertCase(caseRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("SUCCESS", response.getBody().getResponseInfo().getStatus());
        assertEquals(1, response.getBody().getCases().size());
    }

    @Test
    void testProcessAndUpsertCase_InvalidRequest() {
        when(caseService.processAndUpdateCase(any(CourtCase.class), any(RequestInfo.class)))
                .thenThrow(new IllegalArgumentException("Invalid CNR number"));

        ResponseEntity<CaseResponse> response = njdgController.processAndUpsertCase(caseRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("INVALID_REQUEST", response.getBody().getResponseInfo().getStatus());
    }

    @Test
    void testProcessAndUpsertCase_ProcessingError() {
        when(caseService.processAndUpdateCase(any(CourtCase.class), any(RequestInfo.class)))
                .thenThrow(new RuntimeException("Database error"));

        ResponseEntity<CaseResponse> response = njdgController.processAndUpsertCase(caseRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("PROCESSING_ERROR", response.getBody().getResponseInfo().getStatus());
    }

    @Test
    void testProcessAndUpsertCase_NullCourtCase() {
        caseRequest.setCourtCase(null);

        when(caseService.processAndUpdateCase(isNull(), any(RequestInfo.class)))
                .thenThrow(new IllegalArgumentException("CourtCase cannot be null"));

        ResponseEntity<CaseResponse> response = njdgController.processAndUpsertCase(caseRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void testProcessAndUpdateOrder_Success() {
        Order order = new Order();
        order.setOrderNumber("ORD-001");
        order.setStatus("PUBLISHED");

        OrderRequest orderRequest = new OrderRequest();
        orderRequest.setOrder(order);
        orderRequest.setRequestInfo(requestInfo);

        InterimOrder interimOrder = new InterimOrder();
        interimOrder.setCino("CNR-001");

        when(orderService.processOrderRequest(any(Order.class), any(RequestInfo.class)))
                .thenReturn(new ResponseEntity<>(interimOrder, HttpStatus.OK));

        ResponseEntity<InterimOrder> response = njdgController.processAndUpdateOrder(orderRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void testProcessAndUpdateOrder_Error() {
        Order order = new Order();
        order.setOrderNumber("ORD-001");

        OrderRequest orderRequest = new OrderRequest();
        orderRequest.setOrder(order);
        orderRequest.setRequestInfo(requestInfo);

        when(orderService.processOrderRequest(any(Order.class), any(RequestInfo.class)))
                .thenReturn(new ResponseEntity<>(new InterimOrder(), HttpStatus.BAD_REQUEST));

        ResponseEntity<InterimOrder> response = njdgController.processAndUpdateOrder(orderRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void testProcessAndUpdateHearing_Success() {
        Hearing hearing = new Hearing();
        hearing.setHearingId("H-001");
        hearing.setStatus("COMPLETED");
        hearing.setCnrNumbers(Collections.singletonList("CNR-001"));

        HearingRequest hearingRequest = new HearingRequest();
        hearingRequest.setHearing(hearing);
        hearingRequest.setRequestInfo(requestInfo);

        HearingDetails hearingDetails = new HearingDetails();
        hearingDetails.setCino("CNR-001");

        when(hearingService.processAndUpdateHearings(any(Hearing.class), any(RequestInfo.class)))
                .thenReturn(hearingDetails);

        ResponseEntity<HearingDetails> response = njdgController.processAndUpdateHearing(hearingRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void testProcessAndUpdateHearing_Error() {
        Hearing hearing = new Hearing();
        hearing.setHearingId("H-001");

        HearingRequest hearingRequest = new HearingRequest();
        hearingRequest.setHearing(hearing);
        hearingRequest.setRequestInfo(requestInfo);

        when(hearingService.processAndUpdateHearings(any(Hearing.class), any(RequestInfo.class)))
                .thenThrow(new RuntimeException("Processing error"));

        ResponseEntity<HearingDetails> response = njdgController.processAndUpdateHearing(hearingRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void testGetNjdgTransformRecord_Success() {
        when(caseService.getNjdgTransformRecord("CNR-001")).thenReturn(njdgRecord);

        ResponseEntity<NJDGTransformRecord> response = njdgController.getNjdgTransformRecord("CNR-001");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("CNR-001", response.getBody().getCino());
    }

    @Test
    void testGetNjdgTransformRecord_NotFound() {
        when(caseService.getNjdgTransformRecord("UNKNOWN"))
                .thenThrow(new RuntimeException("Not found"));

        ResponseEntity<NJDGTransformRecord> response = njdgController.getNjdgTransformRecord("UNKNOWN");

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void testProcessAndUpdateAdvocates_ActiveAdvocate_Success() {
        Advocate advocate = new Advocate();
        advocate.setId(UUID.randomUUID());
        advocate.setStatus("ACTIVE");
        advocate.setIndividualId("IND-001");

        AdvocateRequest advocateRequest = new AdvocateRequest();
        advocateRequest.setAdvocate(advocate);
        advocateRequest.setRequestInfo(requestInfo);

        AdvocateDetails advocateDetails = new AdvocateDetails();
        advocateDetails.setAdvocateId("IND-001");

        when(advocateService.processAndUpdateAdvocates(any(AdvocateRequest.class)))
                .thenReturn(advocateDetails);

        ResponseEntity<?> response = njdgController.processAndUpdateAdvocates(advocateRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
    }

    @Test
    void testProcessAndUpdateAdvocates_InactiveAdvocate() {
        Advocate advocate = new Advocate();
        advocate.setId(UUID.randomUUID());
        advocate.setStatus("INACTIVE");

        AdvocateRequest advocateRequest = new AdvocateRequest();
        advocateRequest.setAdvocate(advocate);
        advocateRequest.setRequestInfo(requestInfo);

        ResponseEntity<?> response = njdgController.processAndUpdateAdvocates(advocateRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verify(advocateService, never()).processAndUpdateAdvocates(any());
    }

    @Test
    void testProcessAndUpdateAdvocates_NullAdvocate() {
        AdvocateRequest advocateRequest = new AdvocateRequest();
        advocateRequest.setAdvocate(null);
        advocateRequest.setRequestInfo(requestInfo);

        ResponseEntity<?> response = njdgController.processAndUpdateAdvocates(advocateRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    @Test
    void testProcessAndUpdateAdvocates_AlreadyExists() {
        Advocate advocate = new Advocate();
        advocate.setId(UUID.randomUUID());
        advocate.setStatus("ACTIVE");
        advocate.setIndividualId("IND-001");

        AdvocateRequest advocateRequest = new AdvocateRequest();
        advocateRequest.setAdvocate(advocate);
        advocateRequest.setRequestInfo(requestInfo);

        when(advocateService.processAndUpdateAdvocates(any(AdvocateRequest.class)))
                .thenReturn(null);

        ResponseEntity<?> response = njdgController.processAndUpdateAdvocates(advocateRequest);

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
    }

    @Test
    void testProcessAndUpdateAdvocates_Error() {
        Advocate advocate = new Advocate();
        advocate.setId(UUID.randomUUID());
        advocate.setStatus("ACTIVE");
        advocate.setIndividualId("IND-001");

        AdvocateRequest advocateRequest = new AdvocateRequest();
        advocateRequest.setAdvocate(advocate);
        advocateRequest.setRequestInfo(requestInfo);

        when(advocateService.processAndUpdateAdvocates(any(AdvocateRequest.class)))
                .thenThrow(new RuntimeException("Processing error"));

        ResponseEntity<?> response = njdgController.processAndUpdateAdvocates(advocateRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    // Tests for processBusinessDayOrders endpoint
    @Test
    void testProcessBusinessDayOrders_Success() {
        Order order = new Order();
        order.setOrderNumber("ORD-001");
        order.setFilingNumber("FN-001");

        OrderRequest orderRequest = new OrderRequest();
        orderRequest.setOrder(order);
        orderRequest.setRequestInfo(requestInfo);

        doNothing().when(orderNotificationService).processOrdersWithHearings(any(Order.class), any(RequestInfo.class));

        ResponseEntity<?> response = njdgController.processBusinessDayOrders(orderRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(orderNotificationService).processOrdersWithHearings(any(Order.class), any(RequestInfo.class));
    }

    @Test
    void testProcessBusinessDayOrders_NullOrder() {
        OrderRequest orderRequest = new OrderRequest();
        orderRequest.setOrder(null);
        orderRequest.setRequestInfo(requestInfo);

        ResponseEntity<?> response = njdgController.processBusinessDayOrders(orderRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verify(orderNotificationService, never()).processOrdersWithHearings(any(), any());
    }

    @Test
    void testProcessBusinessDayOrders_Error() {
        Order order = new Order();
        order.setOrderNumber("ORD-001");

        OrderRequest orderRequest = new OrderRequest();
        orderRequest.setOrder(order);
        orderRequest.setRequestInfo(requestInfo);

        doThrow(new RuntimeException("Processing error"))
                .when(orderNotificationService).processOrdersWithHearings(any(Order.class), any(RequestInfo.class));

        ResponseEntity<?> response = njdgController.processBusinessDayOrders(orderRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }

    // Tests for processOrderNotification endpoint
    @Test
    void testProcessOrderNotification_Success() {
        Notification notification = Notification.builder()
                .notificationNumber("NOT-001")
                .tenantId("kl.kollam")
                .courtId("COURT-001")
                .createdDate(System.currentTimeMillis())
                .build();
        notification.addCaseNumberItem("CASE-001");

        NotificationRequest notificationRequest = NotificationRequest.builder()
                .notification(notification)
                .requestInfo(requestInfo)
                .build();

        doNothing().when(orderNotificationService).processNotificationOrders(any(Notification.class), any(RequestInfo.class));

        ResponseEntity<?> response = njdgController.processOrderNotification(notificationRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(orderNotificationService).processNotificationOrders(any(Notification.class), any(RequestInfo.class));
    }

    @Test
    void testProcessOrderNotification_NullNotification() {
        NotificationRequest notificationRequest = NotificationRequest.builder()
                .notification(null)
                .requestInfo(requestInfo)
                .build();

        ResponseEntity<?> response = njdgController.processOrderNotification(notificationRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verify(orderNotificationService, never()).processNotificationOrders(any(), any());
    }

    @Test
    void testProcessOrderNotification_Error() {
        Notification notification = Notification.builder()
                .notificationNumber("NOT-001")
                .tenantId("kl.kollam")
                .build();

        NotificationRequest notificationRequest = NotificationRequest.builder()
                .notification(notification)
                .requestInfo(requestInfo)
                .build();

        doThrow(new RuntimeException("Processing error"))
                .when(orderNotificationService).processNotificationOrders(any(Notification.class), any(RequestInfo.class));

        ResponseEntity<?> response = njdgController.processOrderNotification(notificationRequest);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    }
}
