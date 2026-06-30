package org.egov.eTreasury.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.common.contract.models.Document;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.eTreasury.config.PaymentConfiguration;
import org.egov.eTreasury.enrichment.TreasuryEnrichment;
import org.egov.eTreasury.kafka.Producer;
import org.egov.eTreasury.model.*;
import org.egov.eTreasury.repository.AuthSekRepository;
import org.egov.eTreasury.repository.TreasuryPaymentRepository;
import org.egov.eTreasury.util.*;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import javax.crypto.BadPaddingException;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @InjectMocks
    private PaymentService paymentService;

    @Mock
    private PaymentConfiguration config;
    @Mock
    private ETreasuryUtil treasuryUtil;
    @Mock
    private Producer producer;
    @Mock
    private CollectionsUtil collectionsUtil;
    @Mock
    private TreasuryPaymentRepository treasuryPaymentRepository;
    @Mock
    private AuthSekRepository authSekRepository;
    @Mock
    private EncryptionUtil encryptionUtil;
    @Mock
    private ObjectMapper objectMapper;
    @Mock
    private TransactionDetails transactionDetails;
    @Mock
    private TreasuryEnrichment enrichment;
    @Mock
    private CaseUtil caseUtil;
    @Mock
    private DemandUtil demandUtil;

    @Test
    void verifyConnection_success() {
        ConnectionStatus mockStatus = new ConnectionStatus();
        when(config.getServerStatusUrl()).thenReturn("http://test-url.com");
        when(treasuryUtil.callConnectionService(anyString(), any()))
                .thenReturn(ResponseEntity.ok(mockStatus));

        ConnectionStatus result = paymentService.verifyConnection();

        assertNotNull(result);
    }

    @Test
    void verifyConnection_failure() {
        when(config.getServerStatusUrl()).thenReturn("http://test-url.com");
        when(treasuryUtil.callConnectionService(anyString(), eq(ConnectionStatus.class)))
                .thenReturn(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());

        ConnectionStatus result = paymentService.verifyConnection();

        assertNotNull(result);
    }

    @Test
    void getTreasuryPaymentData_success() {
        String testBillId = "testBillId";
        TreasuryPaymentData mockPaymentData = new TreasuryPaymentData();
        mockPaymentData.setFileStoreId("testFileStoreId");

        when(treasuryPaymentRepository.getTreasuryPaymentData(testBillId))
                .thenReturn(Collections.singletonList(mockPaymentData));

        Document result = paymentService.getTreasuryPaymentData(testBillId);

        assertNotNull(result);
        assertEquals("testFileStoreId", result.getFileStore());
        assertEquals("application/pdf", result.getDocumentType());
    }

    @Test
    void getTreasuryPaymentData_notFound() {
        String testBillId = "nonExistentBillId";

        when(treasuryPaymentRepository.getTreasuryPaymentData(testBillId)).thenReturn(Collections.emptyList());

        Document result = paymentService.getTreasuryPaymentData(testBillId);
        assertNull(result, "Expected null when no payment data is found");

        verify(treasuryPaymentRepository, times(1)).getTreasuryPaymentData(testBillId);

    }

    @Test
    void callCollectionServiceAndUpdatePayment_success() {
        TreasuryPaymentRequest mockRequest = mock(TreasuryPaymentRequest.class);
        TreasuryPaymentData mockPaymentData = mock(TreasuryPaymentData.class);
        when(mockRequest.getTreasuryPaymentData()).thenReturn(mockPaymentData);
        mockRequest.setTreasuryPaymentData(mockPaymentData);
        when(mockRequest.getTreasuryPaymentData()).thenReturn(mockPaymentData);
        when(mockPaymentData.getAmount()).thenReturn(BigDecimal.valueOf(10));
        when(mockPaymentData.getBillId()).thenReturn("testBillId");
        paymentService.callCollectionServiceAndUpdatePayment(mockRequest);
        assertNotEquals('Y', mockRequest.getTreasuryPaymentData().getStatus());
    }

    @Test
    void callCollectionServiceAndUpdatePayment_success_1() {
        TreasuryPaymentRequest mockRequest = mock(TreasuryPaymentRequest.class);
        TreasuryPaymentData mockPaymentData = mock(TreasuryPaymentData.class);
        when(mockRequest.getTreasuryPaymentData()).thenReturn(mockPaymentData);
        mockRequest.setTreasuryPaymentData(mockPaymentData);
        when(mockRequest.getTreasuryPaymentData()).thenReturn(mockPaymentData);
        when(mockPaymentData.getAmount()).thenReturn(BigDecimal.valueOf(10));
        when(mockPaymentData.getBillId()).thenReturn("testBillId");
        Character str = 'Y';
        when(mockRequest.getTreasuryPaymentData().getStatus()).thenReturn(str);
        paymentService.callCollectionServiceAndUpdatePayment(mockRequest);
        assertEquals(str, mockRequest.getTreasuryPaymentData().getStatus());
    }

    @Test
    void testPrivateMethod_saveAuthTokenAndSek() throws Exception {
        RequestInfo mockRequestInfo = new RequestInfo();
        AuthSek mockAuthSek = new AuthSek();

        Method privateMethod = PaymentService.class.getDeclaredMethod("saveAuthTokenAndSek", RequestInfo.class, AuthSek.class);
        privateMethod.setAccessible(true);

        privateMethod.invoke(paymentService, mockRequestInfo, mockAuthSek);

        verify(producer).push(eq("save-auth-sek"), any(AuthSekRequest.class));
    }

    @Test
    void testDecryptAndProcessTreasuryPayLoad() throws NoSuchPaddingException, IllegalBlockSizeException, NoSuchAlgorithmException, BadPaddingException, InvalidKeyException, JsonProcessingException {
        TreasuryParams treasuryParams = mock(TreasuryParams.class);
        RequestInfo requestInfo = mock(RequestInfo.class);
        ArrayList<AuthSek> list = new ArrayList<>();
        list.add(mock(AuthSek.class));
        when(authSekRepository.getAuthSek(treasuryParams.getAuthToken())).thenReturn(list);
        Optional<AuthSek> optionalAuthSek = Optional.ofNullable(list.get(0));
        when(optionalAuthSek.get().getDecryptedSek()).thenReturn("testSek");
        when(treasuryParams.getRek()).thenReturn("testRek");
        when(treasuryParams.getData()).thenReturn("testData").toString();
        when(encryptionUtil.decryptResponse("testRek","testSek")).thenReturn("testRek");
        when(encryptionUtil.decryptResponse("testData", "testRek")).thenReturn("testData");
        when(objectMapper.readValue("testData", TransactionDetails.class)).thenReturn(transactionDetails);
        when(transactionDetails.getAmount()).thenReturn("10");
        when(transactionDetails.getStatus()).thenReturn("success");
        when(requestInfo.getUserInfo()).thenReturn(mock(User.class));
        doNothing().when(enrichment).enrichTreasuryPaymentData(any(), any());
        TreasuryPaymentData treasuryPaymentData = paymentService.decryptAndProcessTreasuryPayload(treasuryParams,requestInfo);

        assertNotNull(treasuryPaymentData);
        assertEquals(treasuryPaymentData.getAmount(), BigDecimal.valueOf(10));
    }

    @Test
    void testDecryptAndProcessTreasuryPayLoadListNull() {
        TreasuryParams treasuryParams = mock(TreasuryParams.class);
        RequestInfo requestInfo = mock(RequestInfo.class);
        ArrayList<AuthSek> list = new ArrayList<>();
        when(authSekRepository.getAuthSek(treasuryParams.getAuthToken())).thenReturn(list);
       assertThrows(CustomException.class, () -> paymentService.decryptAndProcessTreasuryPayload(treasuryParams,requestInfo));
    }
    @Test
    void doubleVerifyPayment_success_mockEnabled() throws Exception {
        VerificationData verificationData = new VerificationData();
        verificationData.setBillId("bill-123");
        verificationData.setBusinessService("pg-service");
        verificationData.setMockEnabled(true);
        VerificationDetails details = new VerificationDetails();
        details.setDepartmentId("deptId-1");
        verificationData.setVerificationDetails(details);

        RequestInfo requestInfo = new RequestInfo();
        User user = new User();
        requestInfo.setUserInfo(user);

        when(config.isMockEnabled()).thenReturn(true);
        when(config.getDoubleVerificationUrl()).thenReturn("http://mock-url");
        when(config.getSaveTreasuryPaymentData()).thenReturn("save-topic");
        when(config.isKafkaPushEnabled()).thenReturn(true);

        when(objectMapper.writeValueAsString(any())).thenReturn("mockBody");
        
        String mockResponseRaw = "{\"RETURN_PARAMS\": {\"status\": true, \"data\": \"mockData\"}}";
        ResponseEntity<String> responseEntity = ResponseEntity.ok(mockResponseRaw);

        when(treasuryUtil.callService(anyString(), anyString(), eq("http://mock-url"), eq(String.class), any()))
                .thenReturn(responseEntity);
        
        com.fasterxml.jackson.databind.JsonNode rootNode = new ObjectMapper().readTree(mockResponseRaw);
        when(objectMapper.readTree(mockResponseRaw)).thenReturn(rootNode);
        
        TransactionDetails transactionDetailsMock = new TransactionDetails();
        transactionDetailsMock.setGrn("grn-123");
        transactionDetailsMock.setStatus("Y");
        transactionDetailsMock.setAmount("100.0");
        when(objectMapper.readValue("mockData", TransactionDetails.class)).thenReturn(transactionDetailsMock);

        TreasuryPaymentData data = paymentService.doubleVerifyPayment(verificationData, requestInfo);

        assertNotNull(data);
        assertEquals("grn-123", data.getGrn());
        assertEquals(BigDecimal.valueOf(100.0), data.getAmount());

        verify(producer).push(anyString(), any(TreasuryPaymentRequest.class));
        verify(authSekRepository).updateAuthTokenAndStatusByDepartmentId(anyString(), anyString(), anyString(), eq("SUCCESS"), eq("RECONCILIATION"), anyLong(), eq("PROCESSED"));
    }

    @Test
    void getPaymentStatus_noAttempt_whenNoSession() {
        String billId = "bill-none";
        when(authSekRepository.getAuthSekByBillId(billId)).thenReturn(Collections.emptyList());

        PaymentStatusData result = paymentService.getPaymentStatus(billId, null, new RequestInfo());

        assertNotNull(result);
        assertEquals(PaymentStatusType.NO_ATTEMPT, result.getStatus());
        assertEquals(billId, result.getBillId());
        verify(treasuryPaymentRepository, never()).getTreasuryPaymentData(anyString());
    }

    @Test
    void getPaymentStatus_lookupByConsumerCode_whenBillIdAbsent() {
        String consumerCode = "consumer-123";
        AuthSek session = AuthSek.builder()
                .billId("bill-resolved")
                .serviceNumber(consumerCode)
                .sessionTime(2500L)
                .processedStatus("PENDING")
                .build();
        when(authSekRepository.getAuthSekByServiceNumber(consumerCode)).thenReturn(Collections.singletonList(session));

        PaymentStatusData result = paymentService.getPaymentStatus(null, consumerCode, new RequestInfo());

        assertEquals(PaymentStatusType.VERIFICATION_PENDING, result.getStatus());
        assertEquals("bill-resolved", result.getBillId());
        assertEquals(consumerCode, result.getServiceNumber());
        verify(authSekRepository, never()).getAuthSekByBillId(anyString());
        verify(demandUtil, never()).searchBillIdByConsumerCode(anyString(), any());
    }

    @Test
    void getPaymentStatus_consumerCodeFallback_whenServiceNumberNull() {
        // service_number is null on the session, so the by-serviceNumber lookup misses; the billId is
        // resolved from the consumerCode via the billing service and the session is found by billId.
        String consumerCode = "consumer-null-sn";
        String resolvedBillId = "bill-from-consumer";
        AuthSek session = AuthSek.builder()
                .billId(resolvedBillId)
                .serviceNumber(null)
                .sessionTime(4000L)
                .paymentStatus(PaymentStatus.SUCCESS)
                .completionSource("CALLBACK")
                .processedStatus("PROCESSED")
                .build();
        when(authSekRepository.getAuthSekByServiceNumber(consumerCode)).thenReturn(Collections.emptyList());
        when(demandUtil.searchBillIdByConsumerCode(eq(consumerCode), any())).thenReturn(resolvedBillId);
        when(authSekRepository.getAuthSekByBillId(resolvedBillId)).thenReturn(Collections.singletonList(session));
        when(treasuryPaymentRepository.getTreasuryPaymentData(resolvedBillId)).thenReturn(Collections.emptyList());

        PaymentStatusData result = paymentService.getPaymentStatus(null, consumerCode, new RequestInfo());

        assertEquals(PaymentStatusType.PAID, result.getStatus());
        assertEquals(resolvedBillId, result.getBillId());
        verify(demandUtil).searchBillIdByConsumerCode(eq(consumerCode), any());
        verify(authSekRepository).getAuthSekByBillId(resolvedBillId);
    }

    @Test
    void getPaymentStatus_noAttempt_whenConsumerCodeUnresolvable() {
        // service_number lookup misses and no bill maps to the consumerCode -> NO_ATTEMPT (no failure).
        String consumerCode = "consumer-unknown";
        when(authSekRepository.getAuthSekByServiceNumber(consumerCode)).thenReturn(Collections.emptyList());
        when(demandUtil.searchBillIdByConsumerCode(eq(consumerCode), any())).thenReturn(null);

        PaymentStatusData result = paymentService.getPaymentStatus(null, consumerCode, new RequestInfo());

        assertEquals(PaymentStatusType.NO_ATTEMPT, result.getStatus());
        assertEquals(consumerCode, result.getServiceNumber());
        verify(authSekRepository, never()).getAuthSekByBillId(anyString());
    }

    @Test
    void getPaymentStatus_paid_whenLatestSessionSuccess() {
        String billId = "bill-paid";
        AuthSek session = AuthSek.builder()
                .billId(billId)
                .businessService("pg-service")
                .totalDue(150.0)
                .sessionTime(1000L)
                .paymentStatus(PaymentStatus.SUCCESS)
                .completionSource("CALLBACK")
                .processedStatus("PROCESSED")
                .build();
        when(authSekRepository.getAuthSekByBillId(billId)).thenReturn(Collections.singletonList(session));

        TreasuryPaymentData receipt = new TreasuryPaymentData();
        receipt.setStatus('Y');
        receipt.setGrn("grn-999");
        receipt.setAmount(BigDecimal.valueOf(150.0));
        receipt.setPartyName("John Doe");
        receipt.setFileStoreId("file-store-1");
        when(treasuryPaymentRepository.getTreasuryPaymentData(billId))
                .thenReturn(Collections.singletonList(receipt));

        PaymentStatusData result = paymentService.getPaymentStatus(billId, null, new RequestInfo());

        assertEquals(PaymentStatusType.PAID, result.getStatus());
        assertEquals("CALLBACK", result.getCompletionSource());
        assertEquals("grn-999", result.getGrn());
        assertEquals(BigDecimal.valueOf(150.0), result.getAmount());
        assertEquals("John Doe", result.getPartyName());
        assertEquals("file-store-1", result.getFileStoreId());
    }

    @Test
    void getPaymentStatus_verificationPending_whenLatestSessionPending() {
        String billId = "bill-pending";
        AuthSek session = AuthSek.builder()
                .billId(billId)
                .sessionTime(2000L)
                .processedStatus("PENDING")
                .build();
        when(authSekRepository.getAuthSekByBillId(billId)).thenReturn(Collections.singletonList(session));

        PaymentStatusData result = paymentService.getPaymentStatus(billId, null, new RequestInfo());

        assertEquals(PaymentStatusType.VERIFICATION_PENDING, result.getStatus());
        assertEquals(Long.valueOf(2000L), result.getLastAttemptTime());
        verify(treasuryPaymentRepository, never()).getTreasuryPaymentData(anyString());
    }

    @Test
    void getPaymentStatus_failed_whenLatestSessionTerminalNonSuccess() {
        String billId = "bill-failed";
        AuthSek session = AuthSek.builder()
                .billId(billId)
                .sessionTime(3000L)
                .paymentStatus(PaymentStatus.FAILED)
                .processedStatus("FAILED")
                .build();
        when(authSekRepository.getAuthSekByBillId(billId)).thenReturn(Collections.singletonList(session));

        PaymentStatusData result = paymentService.getPaymentStatus(billId, null, new RequestInfo());

        assertEquals(PaymentStatusType.FAILED, result.getStatus());
        verify(treasuryPaymentRepository, never()).getTreasuryPaymentData(anyString());
    }
}
