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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;

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
        String transactionString = request.getTransactionDetails().toString();
        SecretKeySpec secretKeySpec = aes256Util.readKeyBytes(config.getSbiSecretKey());
        String encryptedString = aes256Util.encrypt(transactionString, secretKeySpec);

        Map<String, String> transactionMap = new HashMap<>();
        transactionMap.put("encryptedString", encryptedString);
        transactionMap.put("transactionUrl", config.getSbiTransactionUrl());
        transactionMap.put("merchantId", config.getSbiMerchantId());

        producer.push(paymentConfiguration.getCreateTransactionDetails(), request);

        paymentUtil.callSbiGateway(transactionMap);

        return transactionMap;
    }

    public TransactionDetails decryptBrowserPayload(BrowserRequest request) {
        String encryptedPayload = request.getEncryptedPayload();
        SecretKeySpec secretKeySpec = aes256Util.readKeyBytes(config.getSbiSecretKey());
        String decryptedPayloadString = aes256Util.decrypt(encryptedPayload, secretKeySpec);
        BrowserDetails browserDetails = BrowserDetails.fromString(decryptedPayloadString);

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

    private Long convertTimestampToMillis(String timestampStr) {
        List<DateTimeFormatter> formatters = new ArrayList<>();
        formatters.add(DateTimeFormatter.ofPattern("yyyy-mm-dd hh:mm:ss"));
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
