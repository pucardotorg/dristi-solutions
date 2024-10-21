package org.egov.sbi.service;

import digit.models.coremodels.PaymentDetail;
import lombok.extern.slf4j.Slf4j;
import org.egov.sbi.config.PaymentConfiguration;
import org.egov.sbi.enrichemnt.PaymentEnrichment;
import org.egov.sbi.kafka.Producer;
import org.egov.sbi.model.*;
import org.egov.sbi.repository.TransactionDetailsRepository;
import org.egov.sbi.util.AES256Util;
import org.egov.sbi.util.CollectionsUtil;
import org.egov.sbi.util.PaymentUtil;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;

import static org.egov.sbi.config.ServiceConstants.*;

@Service
@Slf4j
public class PaymentService {

    private final PaymentEnrichment paymentEnrichment;

    private final Producer producer;

    private final AES256Util aes256Util;

    private final PaymentConfiguration config;

    private final TransactionDetailsRepository repository;

    private final PaymentConfiguration paymentConfiguration;

    private final CollectionsUtil collectionsUtil;

    private final PaymentUtil paymentUtil;

    @Autowired
    public PaymentService(PaymentEnrichment paymentEnrichment, Producer producer, AES256Util aes256Util, PaymentConfiguration config, TransactionDetailsRepository repository, PaymentConfiguration paymentConfiguration, CollectionsUtil collectionsUtil, PaymentUtil paymentUtil) {
        this.paymentEnrichment = paymentEnrichment;
        this.producer = producer;
        this.aes256Util = aes256Util;
        this.config = config;
        this.repository = repository;
        this.paymentConfiguration = paymentConfiguration;
        this.collectionsUtil = collectionsUtil;
        this.paymentUtil = paymentUtil;
    }


    public Map<String, String> processTransaction(TransactionRequest request) {
        paymentEnrichment.enrichTransaction(request);
        SecretKeySpec secretKeySpec = aes256Util.readKeyBytes(config.getSbiSecretKey());

        String multiAccountString = request.getTransactionDetails().toMultiAccountPaymentString();
        String singleRequestString = request.getTransactionDetails().toSingleRequestString();

        String encryptedMultiAccountString = aes256Util.encrypt(multiAccountString, secretKeySpec);
        String encryptedSingleRequestString = aes256Util.encrypt(singleRequestString, secretKeySpec);

        Map<String, String> transactionMap = new HashMap<>();
        transactionMap.put("encryptedString", encryptedSingleRequestString);
        transactionMap.put("encryptedMultiAccountString", encryptedMultiAccountString);
        transactionMap.put("transactionUrl", config.getSbiTransactionUrl());
        transactionMap.put("merchantId", config.getSbiMerchantId());

        producer.push(paymentConfiguration.getCreateTransactionDetails(), request);

        return transactionMap;
    }

    public TransactionDetails decryptBrowserPayload(BrowserRequest request) {
        String encryptedPayload = request.getEncryptedPayload();
        SecretKeySpec secretKeySpec = aes256Util.readKeyBytes(config.getSbiSecretKey());
        String decryptedPayloadString = aes256Util.decrypt(encryptedPayload, secretKeySpec);
        BrowserDetails browserDetails = BrowserDetails.fromString(decryptedPayloadString);

        doubleVerificationPayment(browserDetails);

        TransactionSearchCriteria searchCriteria = TransactionSearchCriteria.builder()
                .merchantOrderNumber(browserDetails.getMerchantOrderNumber()).build();
        TransactionDetails transactionDetails = repository.getTransactionDetails(searchCriteria)
                .stream().findFirst().get();

        if (transactionDetails.getTransactionStatus() != null
                && transactionDetails.getTransactionStatus().equalsIgnoreCase(browserDetails.getTransactionStatus())) {
            return transactionDetails;
        }

        paymentEnrichment.enrichTransactionResponse(transactionDetails, browserDetails, request.getRequestInfo());

        TransactionRequest transactionRequest =  TransactionRequest.builder()
                .requestInfo(request.getRequestInfo()).transactionDetails(transactionDetails).build();
        producer.push(paymentConfiguration.getUpdateTransactionDetails(), transactionRequest);

        return transactionDetails;
    }

    public List<TransactionDetails> searchTransactions(TransactionSearchRequest request) {
        return repository.getTransactionDetails(request.getSearchCriteria());
    }

    public void callCollectionServiceAndUpdatePayment(TransactionRequest request) {

        PaymentDetail paymentDetail = PaymentDetail.builder()
                .billId(request.getTransactionDetails().getBillId())
                .totalDue(BigDecimal.valueOf(request.getTransactionDetails().getTotalDue()))
                .totalAmountPaid(new BigDecimal(String.valueOf(request.getTransactionDetails().getPostingAmount())))
                .businessService(request.getTransactionDetails().getBusinessService()).build();

        Payment payment = Payment.builder()
                .tenantId(config.getEgovStateTenantId())
                .paymentDetails(Collections.singletonList(paymentDetail))
                .payerName(request.getTransactionDetails().getPayerName())
                .paidBy(request.getTransactionDetails().getPaidBy())
                .mobileNumber(request.getTransactionDetails().getMobileNumber())
                .transactionNumber(request.getTransactionDetails().getSbiEpayRefId())
                .transactionDate(convertTimestampToMillis(request.getTransactionDetails().getTransactionDate()))
                .instrumentNumber(request.getTransactionDetails().getCin())
                .instrumentDate(convertTimestampToMillis(request.getTransactionDetails().getTransactionDate()))
                .paymentMode("ONLINE")
                .build();
        if (request.getTransactionDetails().getTransactionStatus().equalsIgnoreCase("SUCCESS")) {
            payment.setTotalAmountPaid(new BigDecimal(request.getTransactionDetails().getPostingAmount()));
            payment.setPaymentStatus("DEPOSITED");
        } else {
            payment.setTotalAmountPaid(BigDecimal.ZERO);
        }
        PaymentRequest paymentRequest = new PaymentRequest(request.getRequestInfo(), payment);
        collectionsUtil.callService(paymentRequest, config.getCollectionServiceHost(), config.getCollectionsPaymentCreatePath());
    }

    private void doubleVerificationPayment(BrowserDetails browserDetails){
        String sbiEpayRefId = browserDetails.getSbiEpayRefId();
        String merchantId = config.getSbiMerchantId();
        String merchantOrderNumber = browserDetails.getMerchantOrderNumber();
        String amount = String.valueOf(browserDetails.getAmount());
        String queryRequest = String.join("|", sbiEpayRefId, merchantId, merchantOrderNumber, amount);

        Map<String, String> params = new HashMap<>();
        params.put("queryRequest", queryRequest);
        params.put("aggregatorId", config.getSbiAggregatorId());
        params.put("merchantId", merchantId);
        ResponseEntity<String> responseEntity = paymentUtil.doubleVerificationRequest(params);
        if(responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
            String response = responseEntity.getBody();
            if(response.equals(SBIVERIFICATIONERROR) || response.equals(SBIINVALIDDATAERROR)){
                throw new CustomException(DOUBLE_VERIFICATION_FAILED, "fail double verification: " + response);
            }
            else{
                BrowserDetails doubleVerificationBrowserDetails = getBrowserdetailsFromString(response);
                if (!browserDetails.getTransactionStatus().equals(doubleVerificationBrowserDetails.getTransactionStatus())
                        && browserDetails.getAmount() != doubleVerificationBrowserDetails.getAmount()) {
                    throw new CustomException(DOUBLE_VERIFICATION_FAILED, "failed to verify double verification");
                }
            }
        }
        else{
            throw new CustomException(DOUBLE_VERIFICATION_FAILED, "failed to access double verification api");
        }

    }

    private BrowserDetails getBrowserdetailsFromString(String browserDetailsString){
        String[] parts = browserDetailsString.split("\\|", -1);
        BrowserDetails browserDetails = new BrowserDetails();

        browserDetails.setMerchantId(parts[0]);
        browserDetails.setSbiEpayRefId(parts[1]);
        browserDetails.setTransactionStatus(parts[2]);
        browserDetails.setCountry(parts[3]);
        browserDetails.setCurrency(parts[4]);
        browserDetails.setOtherDetails(parts[5]);
        browserDetails.setMerchantOrderNumber(parts[6]);
        browserDetails.setAmount(Double.parseDouble(parts[7]));
        browserDetails.setBankCode(parts[9]);
        browserDetails.setBankReferenceNumber(parts[10]);
        browserDetails.setTransactionDate(parts[11]);
        browserDetails.setPayMode(parts[12]);
        browserDetails.setCin(parts[13]);
        browserDetails.setRef1(parts[15]);
        browserDetails.setRef2(parts[16]);
        browserDetails.setRef3(parts[17]);
        browserDetails.setRef4(parts[18]);
        browserDetails.setRef5(parts[19]);
        browserDetails.setRef6(parts[20]);
        browserDetails.setRef7(parts[21]);
        browserDetails.setRef8(parts[22]);
        browserDetails.setRef9(parts[23]);

        return browserDetails;
    }

    private Long convertTimestampToMillis(String timestampStr) {
        List<DateTimeFormatter> formatters = new ArrayList<>();
        formatters.add(DateTimeFormatter.ofPattern("yyyy-mm-dd HH:mm:ss"));
        LocalDateTime dateTime = null;
        for (DateTimeFormatter formatter : formatters) {
            try {
                dateTime = LocalDateTime.parse(timestampStr, formatter);
                break;
            } catch (Exception e) {
                log.error("Failed to parse String {} to millis", timestampStr);
            }
        }
        if (dateTime != null) {
            return dateTime.toInstant(ZoneOffset.UTC).toEpochMilli();
        } else {
            return null;
        }
    }
}
