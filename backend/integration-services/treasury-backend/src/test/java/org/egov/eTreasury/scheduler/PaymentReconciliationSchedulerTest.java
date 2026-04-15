package org.egov.eTreasury.scheduler;

import org.egov.common.contract.request.RequestInfo;
import org.egov.eTreasury.config.PaymentConfiguration;
import org.egov.eTreasury.model.AuthSek;
import org.egov.eTreasury.model.VerificationData;
import org.egov.eTreasury.repository.AuthSekRepository;
import org.egov.eTreasury.service.PaymentService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentReconciliationSchedulerTest {

    @InjectMocks
    private PaymentReconciliationScheduler paymentReconciliationScheduler;

    @Mock
    private AuthSekRepository authSekRepository;

    @Mock
    private PaymentService paymentService;

    @Mock
    private PaymentConfiguration config;

    @Test
    void reconcilePendingPayments_success() {
        // Arrange
        long thresholdHours = 24L;
        when(config.getReconciliationThresholdHours()).thenReturn(thresholdHours);
        when(config.getOfficeCode()).thenReturn("OFFICE_CODE");
        when(config.getServiceDeptCode()).thenReturn("DEPT_CODE");
        when(config.getEgovStateTenantId()).thenReturn("STATE_TENANT_ID");

        AuthSek authSek = new AuthSek();
        authSek.setBillId("billId-123");
        authSek.setDepartmentId("deptId-1");
        authSek.setTotalDue(100.0);
        authSek.setBusinessService("pg-service");
        authSek.setServiceNumber("srv-num");
        authSek.setMobileNumber("9999999999");
        authSek.setPaidBy("tester");

        List<AuthSek> pendingPayments = Collections.singletonList(authSek);
        when(authSekRepository.getPendingAuthSeks(anyLong())).thenReturn(pendingPayments);

        // Act
        paymentReconciliationScheduler.reconcilePendingPayments();

        // Assert
        verify(authSekRepository, times(1)).getPendingAuthSeks(anyLong());
        
        ArgumentCaptor<VerificationData> verificationDataCaptor = ArgumentCaptor.forClass(VerificationData.class);
        ArgumentCaptor<RequestInfo> requestInfoCaptor = ArgumentCaptor.forClass(RequestInfo.class);

        verify(paymentService, times(1)).doubleVerifyPayment(verificationDataCaptor.capture(), requestInfoCaptor.capture());

        VerificationData capturedVerificationData = verificationDataCaptor.getValue();
        assertNotNull(capturedVerificationData);
        assertEquals("billId-123", capturedVerificationData.getBillId());
        assertEquals("pg-service", capturedVerificationData.getBusinessService());
        assertEquals("srv-num", capturedVerificationData.getServiceNumber());
        assertEquals(100.0, capturedVerificationData.getTotalDue());
        assertEquals("9999999999", capturedVerificationData.getMobileNumber());
        assertEquals("tester", capturedVerificationData.getPaidBy());
        assertNotNull(capturedVerificationData.getVerificationDetails());
        assertEquals("deptId-1", capturedVerificationData.getVerificationDetails().getDepartmentId());
        assertEquals("OFFICE_CODE", capturedVerificationData.getVerificationDetails().getOfficeCode());
        assertEquals("DEPT_CODE", capturedVerificationData.getVerificationDetails().getServiceDeptCode());
        assertEquals(100.0, capturedVerificationData.getVerificationDetails().getAmount());

        RequestInfo capturedRequestInfo = requestInfoCaptor.getValue();
        assertNotNull(capturedRequestInfo);
        assertNotNull(capturedRequestInfo.getUserInfo());
        assertEquals("SYSTEM", capturedRequestInfo.getUserInfo().getUuid());
        assertEquals("SYSTEM", capturedRequestInfo.getUserInfo().getName());
        assertEquals("STATE_TENANT_ID", capturedRequestInfo.getUserInfo().getTenantId());
    }

    @Test
    void reconcilePendingPayments_handlesExceptionForSinglePayment() {
        // Arrange
        long thresholdHours = 24L;
        when(config.getReconciliationThresholdHours()).thenReturn(thresholdHours);

        AuthSek authSek1 = new AuthSek();
        authSek1.setBillId("billId-1");
        
        AuthSek authSek2 = new AuthSek();
        authSek2.setBillId("billId-2");

        List<AuthSek> pendingPayments = List.of(authSek1, authSek2);
        when(authSekRepository.getPendingAuthSeks(anyLong())).thenReturn(pendingPayments);

        doThrow(new RuntimeException("Test exception")).when(paymentService).doubleVerifyPayment(any(), any());

        // Act
        paymentReconciliationScheduler.reconcilePendingPayments();

        // Assert
        verify(authSekRepository, times(1)).getPendingAuthSeks(anyLong());
        verify(paymentService, times(2)).doubleVerifyPayment(any(), any());
    }

    @Test
    void reconcilePendingPayments_noPaymentsFound() {
        // Arrange
        when(config.getReconciliationThresholdHours()).thenReturn(24L);
        when(authSekRepository.getPendingAuthSeks(anyLong())).thenReturn(Collections.emptyList());

        // Act
        paymentReconciliationScheduler.reconcilePendingPayments();

        // Assert
        verify(authSekRepository, times(1)).getPendingAuthSeks(anyLong());
        verify(paymentService, never()).doubleVerifyPayment(any(), any());
    }
}
