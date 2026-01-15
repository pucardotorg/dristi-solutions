package com.dristi.njdg_transformer.service;

import com.dristi.njdg_transformer.config.TransformerProperties;
import com.dristi.njdg_transformer.model.DesignationMaster;
import com.dristi.njdg_transformer.model.HearingDetails;
import com.dristi.njdg_transformer.model.JudgeDetails;
import com.dristi.njdg_transformer.model.hearing.Hearing;
import com.dristi.njdg_transformer.model.order.Notification;
import com.dristi.njdg_transformer.model.order.Order;
import com.dristi.njdg_transformer.producer.Producer;
import com.dristi.njdg_transformer.repository.CaseRepository;
import com.dristi.njdg_transformer.repository.HearingRepository;
import com.dristi.njdg_transformer.utils.HearingUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.common.contract.request.RequestInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
class OrderNotificationServiceTest {

    @Mock
    private HearingUtil hearingUtil;

    @Mock
    private CaseRepository caseRepository;

    @Mock
    private TransformerProperties properties;

    @Mock
    private HearingRepository hearingRepository;

    @Mock
    private Producer producer;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private OrderNotificationService orderNotificationService;

    private Order order;
    private RequestInfo requestInfo;
    private JudgeDetails judgeDetails;
    private DesignationMaster designationMaster;
    private Hearing completedHearing;
    private Hearing scheduledHearing;

    @BeforeEach
    void setUp() {
        order = new Order();
        order.setOrderNumber("ORD-001");
        order.setFilingNumber("FN-001");
        order.setCnrNumber("CNR-001");
        order.setTenantId("kl.kollam");
        order.setCreatedDate(System.currentTimeMillis());
        order.setOrderCategory("INTERMEDIATE");
        order.setOrderType("SUMMONS");

        requestInfo = RequestInfo.builder().build();

        judgeDetails = new JudgeDetails();
        judgeDetails.setJudgeCode(1);
        judgeDetails.setJocode("JO-001");
        judgeDetails.setCourtNo(1);
        judgeDetails.setDesgCode(1);

        designationMaster = new DesignationMaster();
        designationMaster.setDesgCode(1);
        designationMaster.setDesgName("JUDICIAL_MAGISTRATE");

        completedHearing = Hearing.builder()
                .hearingId("H-001")
                .status("COMPLETED")
                .hearingType("EVIDENCE")
                .startTime(System.currentTimeMillis() - 86400000L) // Yesterday
                .cnrNumbers(Collections.singletonList("CNR-001"))
                .build();

        scheduledHearing = Hearing.builder()
                .hearingId("H-002")
                .status("SCHEDULED")
                .hearingType("ARGUMENTS")
                .startTime(System.currentTimeMillis() + 86400000L) // Tomorrow
                .cnrNumbers(Collections.singletonList("CNR-001"))
                .build();
    }

    @Test
    void testProcessOrdersWithHearings_Success() {
        List<Hearing> hearings = Arrays.asList(completedHearing, scheduledHearing);

        when(hearingUtil.fetchHearingDetails(any())).thenReturn(hearings);
        when(caseRepository.getJudge(any(LocalDate.class))).thenReturn(Collections.singletonList(judgeDetails));
        when(caseRepository.getDesignationMaster(anyString())).thenReturn(designationMaster);
        when(hearingRepository.getHearingPurposeCode(any(Hearing.class))).thenReturn(1);
        when(hearingRepository.getHearingDetailsByCino(anyString())).thenReturn(Collections.emptyList());
        when(properties.getApplicationZoneId()).thenReturn("Asia/Kolkata");

        orderNotificationService.processOrdersWithHearings(order, requestInfo);

        verify(producer).push(eq("save-hearing-details"), any(HearingDetails.class));
    }

    @Test
    void testProcessOrdersWithHearings_WithHearingNumber() {
        order.setHearingNumber("H-001");
        List<Hearing> hearings = Arrays.asList(completedHearing, scheduledHearing);

        when(hearingUtil.fetchHearingDetails(any())).thenReturn(hearings);
        when(caseRepository.getJudge(any(LocalDate.class))).thenReturn(Collections.singletonList(judgeDetails));
        when(caseRepository.getDesignationMaster(anyString())).thenReturn(designationMaster);
        when(hearingRepository.getHearingPurposeCode(any(Hearing.class))).thenReturn(1);
        when(hearingRepository.getHearingDetailsByCino(anyString())).thenReturn(Collections.emptyList());
        when(properties.getApplicationZoneId()).thenReturn("Asia/Kolkata");

        orderNotificationService.processOrdersWithHearings(order, requestInfo);

        verify(producer).push(eq("save-hearing-details"), any(HearingDetails.class));
    }

    @Test
    void testProcessOrdersWithHearings_CompositeOrder() {
        order.setOrderCategory("COMPOSITE");
        order.setHearingNumber(null);
        List<Hearing> hearings = Arrays.asList(completedHearing, scheduledHearing);

        when(hearingUtil.fetchHearingDetails(any())).thenReturn(hearings);
        when(caseRepository.getJudge(any(LocalDate.class))).thenReturn(Collections.singletonList(judgeDetails));
        when(caseRepository.getDesignationMaster(anyString())).thenReturn(designationMaster);
        when(hearingRepository.getHearingPurposeCode(any(Hearing.class))).thenReturn(1);
        when(hearingRepository.getHearingDetailsByCino(anyString())).thenReturn(Collections.emptyList());
        when(properties.getApplicationZoneId()).thenReturn("Asia/Kolkata");

        orderNotificationService.processOrdersWithHearings(order, requestInfo);

        verify(producer).push(eq("save-hearing-details"), any(HearingDetails.class));
    }

    @Test
    void testProcessOrdersWithHearings_NoScheduledHearing() {
        List<Hearing> hearings = Collections.singletonList(completedHearing);

        lenient().when(hearingUtil.fetchHearingDetails(any())).thenReturn(hearings);
        lenient().when(caseRepository.getJudge(any(LocalDate.class))).thenReturn(Collections.singletonList(judgeDetails));
        lenient().when(caseRepository.getDesignationMaster(anyString())).thenReturn(designationMaster);
        lenient().when(hearingRepository.getHearingPurposeCode(any(Hearing.class))).thenReturn(1);
        lenient().when(hearingRepository.getHearingDetailsByCino(anyString())).thenReturn(Collections.emptyList());
        lenient().when(properties.getApplicationZoneId()).thenReturn("Asia/Kolkata");

        orderNotificationService.processOrdersWithHearings(order, requestInfo);

        verify(producer).push(eq("save-hearing-details"), any(HearingDetails.class));
    }

    @Test
    void testProcessOrdersWithHearings_NoJudgeDetails() {
        List<Hearing> hearings = Arrays.asList(completedHearing, scheduledHearing);

        when(hearingUtil.fetchHearingDetails(any())).thenReturn(hearings);
        when(caseRepository.getJudge(any(LocalDate.class))).thenReturn(Collections.emptyList());
        when(caseRepository.getDesignationMaster(anyString())).thenReturn(designationMaster);
        when(hearingRepository.getHearingPurposeCode(any(Hearing.class))).thenReturn(1);
        when(hearingRepository.getHearingDetailsByCino(anyString())).thenReturn(Collections.emptyList());
        when(properties.getApplicationZoneId()).thenReturn("Asia/Kolkata");

        orderNotificationService.processOrdersWithHearings(order, requestInfo);

        verify(producer).push(eq("save-hearing-details"), any(HearingDetails.class));
    }

    @Test
    void testProcessOrdersWithHearings_EmptyHearingList() {
        lenient().when(hearingUtil.fetchHearingDetails(any())).thenReturn(Collections.emptyList());
        lenient().when(caseRepository.getJudge(any(LocalDate.class))).thenReturn(Collections.singletonList(judgeDetails));
        lenient().when(caseRepository.getDesignationMaster(anyString())).thenReturn(designationMaster);
        lenient().when(hearingRepository.getHearingDetailsByCino(anyString())).thenReturn(Collections.emptyList());
        lenient().when(properties.getApplicationZoneId()).thenReturn("Asia/Kolkata");

        orderNotificationService.processOrdersWithHearings(order, requestInfo);

        verify(producer).push(eq("save-hearing-details"), any(HearingDetails.class));
    }

    @Test
    void testProcessOrdersWithHearings_UpdatesExistingHearings() {
        List<Hearing> hearings = Arrays.asList(completedHearing, scheduledHearing);
        HearingDetails existingHearing = HearingDetails.builder()
                .cino("CNR-001")
                .srNo(1)
                .nextDate(null)
                .build();

        when(hearingUtil.fetchHearingDetails(any())).thenReturn(hearings);
        when(caseRepository.getJudge(any(LocalDate.class))).thenReturn(Collections.singletonList(judgeDetails));
        when(caseRepository.getDesignationMaster(anyString())).thenReturn(designationMaster);
        when(hearingRepository.getHearingPurposeCode(any(Hearing.class))).thenReturn(1);
        when(hearingRepository.getHearingDetailsByCino(anyString())).thenReturn(Collections.singletonList(existingHearing));
        when(properties.getApplicationZoneId()).thenReturn("Asia/Kolkata");

        orderNotificationService.processOrdersWithHearings(order, requestInfo);

        verify(producer).push(eq("save-hearing-details"), any(HearingDetails.class));
        verify(producer).push(eq("update-hearing-details"), any(HearingDetails.class));
    }

    @Test
    void testProcessOrdersWithHearings_WithItemText() {
        order.setItemText("<p>Case adjourned for arguments</p>");
        List<Hearing> hearings = Collections.singletonList(completedHearing);

        lenient().when(hearingUtil.fetchHearingDetails(any())).thenReturn(hearings);
        lenient().when(caseRepository.getJudge(any(LocalDate.class))).thenReturn(Collections.singletonList(judgeDetails));
        lenient().when(caseRepository.getDesignationMaster(anyString())).thenReturn(designationMaster);
        lenient().when(hearingRepository.getHearingPurposeCode(any(Hearing.class))).thenReturn(1);
        lenient().when(hearingRepository.getHearingDetailsByCino(anyString())).thenReturn(Collections.emptyList());
        lenient().when(properties.getApplicationZoneId()).thenReturn("Asia/Kolkata");

        orderNotificationService.processOrdersWithHearings(order, requestInfo);

        verify(producer).push(eq("save-hearing-details"), any(HearingDetails.class));
    }

    @Test
    void testProcessNotificationOrders_Success() {
        Notification notification = Notification.builder()
                .notificationNumber("NOT-001")
                .tenantId("kl.kollam")
                .courtId("COURT-001")
                .createdDate(System.currentTimeMillis())
                .build();
        notification.addCaseNumberItem("CASE-001");

        Hearing scheduledNotificationHearing = Hearing.builder()
                .hearingId("H-003")
                .status("SCHEDULED")
                .hearingType("ARGUMENTS")
                .startTime(System.currentTimeMillis() + 86400000L)
                .cnrNumbers(Collections.singletonList("CNR-002"))
                .caseReferenceNumber("CASE-001")
                .build();

        when(hearingUtil.fetchHearingDetails(any())).thenReturn(Collections.singletonList(scheduledNotificationHearing));
        when(caseRepository.getJudge(any(LocalDate.class))).thenReturn(Collections.singletonList(judgeDetails));
        when(caseRepository.getDesignationMaster(anyString())).thenReturn(designationMaster);
        when(hearingRepository.getHearingPurposeCode(any(Hearing.class))).thenReturn(1);
        when(properties.getApplicationZoneId()).thenReturn("Asia/Kolkata");
        when(properties.getNotificationOrderBusinessTemplate()).thenReturn("Case scheduled from {hearingDate} to {nextDate}");

        orderNotificationService.processNotificationOrders(notification, requestInfo);

        verify(producer).push(eq("save-hearing-details"), any(HearingDetails.class));
    }

    @Test
    void testProcessNotificationOrders_MultipleCaseNumbers() {
        Notification notification = Notification.builder()
                .notificationNumber("NOT-001")
                .tenantId("kl.kollam")
                .courtId("COURT-001")
                .createdDate(System.currentTimeMillis())
                .build();
        notification.addCaseNumberItem("CASE-001");
        notification.addCaseNumberItem("CASE-002");

        Hearing hearing1 = Hearing.builder()
                .hearingId("H-003")
                .status("SCHEDULED")
                .hearingType("ARGUMENTS")
                .startTime(System.currentTimeMillis() + 86400000L)
                .cnrNumbers(Collections.singletonList("CNR-002"))
                .caseReferenceNumber("CASE-001")
                .build();

        Hearing hearing2 = Hearing.builder()
                .hearingId("H-004")
                .status("SCHEDULED")
                .hearingType("EVIDENCE")
                .startTime(System.currentTimeMillis() + 172800000L)
                .cnrNumbers(Collections.singletonList("CNR-003"))
                .caseReferenceNumber("CASE-002")
                .build();

        when(hearingUtil.fetchHearingDetails(any())).thenReturn(Arrays.asList(hearing1, hearing2));
        when(caseRepository.getJudge(any(LocalDate.class))).thenReturn(Collections.singletonList(judgeDetails));
        when(caseRepository.getDesignationMaster(anyString())).thenReturn(designationMaster);
        when(hearingRepository.getHearingPurposeCode(any(Hearing.class))).thenReturn(1);
        when(properties.getApplicationZoneId()).thenReturn("Asia/Kolkata");
        when(properties.getNotificationOrderBusinessTemplate()).thenReturn("Case scheduled from {hearingDate} to {nextDate}");

        orderNotificationService.processNotificationOrders(notification, requestInfo);

        verify(producer, times(2)).push(eq("save-hearing-details"), any(HearingDetails.class));
    }

    @Test
    void testProcessNotificationOrders_NoMatchingHearings() {
        Notification notification = Notification.builder()
                .notificationNumber("NOT-001")
                .tenantId("kl.kollam")
                .courtId("COURT-001")
                .createdDate(System.currentTimeMillis())
                .build();
        notification.addCaseNumberItem("CASE-001");

        Hearing nonMatchingHearing = Hearing.builder()
                .hearingId("H-003")
                .status("SCHEDULED")
                .hearingType("ARGUMENTS")
                .startTime(System.currentTimeMillis() + 86400000L)
                .cnrNumbers(Collections.singletonList("CNR-002"))
                .caseReferenceNumber("DIFFERENT-CASE")
                .build();

        when(hearingUtil.fetchHearingDetails(any())).thenReturn(Collections.singletonList(nonMatchingHearing));

        orderNotificationService.processNotificationOrders(notification, requestInfo);

        verify(producer, never()).push(eq("save-hearing-details"), any(HearingDetails.class));
    }

    @Test
    void testProcessNotificationOrders_CompletedHearingSkipped() {
        Notification notification = Notification.builder()
                .notificationNumber("NOT-001")
                .tenantId("kl.kollam")
                .courtId("COURT-001")
                .createdDate(System.currentTimeMillis())
                .build();
        notification.addCaseNumberItem("CASE-001");

        Hearing completedNotificationHearing = Hearing.builder()
                .hearingId("H-003")
                .status("COMPLETED")
                .hearingType("ARGUMENTS")
                .startTime(System.currentTimeMillis() - 86400000L)
                .cnrNumbers(Collections.singletonList("CNR-002"))
                .caseReferenceNumber("CASE-001")
                .build();

        when(hearingUtil.fetchHearingDetails(any())).thenReturn(Collections.singletonList(completedNotificationHearing));

        orderNotificationService.processNotificationOrders(notification, requestInfo);

        verify(producer, never()).push(eq("save-hearing-details"), any(HearingDetails.class));
    }

    @Test
    void testProcessNotificationOrders_NoJudgeDetails() {
        Notification notification = Notification.builder()
                .notificationNumber("NOT-001")
                .tenantId("kl.kollam")
                .courtId("COURT-001")
                .createdDate(System.currentTimeMillis())
                .build();
        notification.addCaseNumberItem("CASE-001");

        Hearing scheduledNotificationHearing = Hearing.builder()
                .hearingId("H-003")
                .status("SCHEDULED")
                .hearingType("ARGUMENTS")
                .startTime(System.currentTimeMillis() + 86400000L)
                .cnrNumbers(Collections.singletonList("CNR-002"))
                .caseReferenceNumber("CASE-001")
                .build();

        when(hearingUtil.fetchHearingDetails(any())).thenReturn(Collections.singletonList(scheduledNotificationHearing));
        when(caseRepository.getJudge(any(LocalDate.class))).thenReturn(Collections.emptyList());
        when(caseRepository.getDesignationMaster(anyString())).thenReturn(designationMaster);
        when(hearingRepository.getHearingPurposeCode(any(Hearing.class))).thenReturn(1);
        when(properties.getApplicationZoneId()).thenReturn("Asia/Kolkata");
        when(properties.getNotificationOrderBusinessTemplate()).thenReturn("Case scheduled from {hearingDate} to {nextDate}");

        orderNotificationService.processNotificationOrders(notification, requestInfo);

        verify(producer).push(eq("save-hearing-details"), any(HearingDetails.class));
    }

    @Test
    void testProcessNotificationOrders_EmptyHearingsList() {
        Notification notification = Notification.builder()
                .notificationNumber("NOT-001")
                .tenantId("kl.kollam")
                .courtId("COURT-001")
                .createdDate(System.currentTimeMillis())
                .build();
        notification.addCaseNumberItem("CASE-001");

        when(hearingUtil.fetchHearingDetails(any())).thenReturn(Collections.emptyList());

        orderNotificationService.processNotificationOrders(notification, requestInfo);

        verify(producer, never()).push(eq("save-hearing-details"), any(HearingDetails.class));
    }
}
