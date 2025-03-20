package org.egov.eTreasury.config;

import jakarta.annotation.PostConstruct;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@Configuration
@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
public class PaymentConfiguration {

    //Tenant Id
    @Value("${egov-state-level-tenant-id}")
    private String egovStateTenantId;

    //ETreasury
    @Value("${treasury-public-key}")
    private String publicKey;

    @Value("${treasury-client-secret}")
    private String clientSecret;

    @Value("${treasury-client-id}")
    private String clientId;

    @Value("${treasury_head_id1}")
    private String headId1;

    @Value("${treasury_head_id2}")
    private String headId2;

    @Value("${treasury_head_id3}")
    private String headId3;

    @Value("${service-dept-code}")
    private String serviceDeptCode;

    @Value("${office-code}")
    private String officeCode;

    @Value("${dept-reference-id}")
    private String deptReferenceId;

    @Value("${treasury-server-status-url}")
    private String serverStatusUrl;

    @Value("${treasury-auth-url}")
    private String authUrl;

    @Value("${treasury-challan-generate-url}")
    private String challanGenerateUrl;

    @Value("${treasury-double-verification-url}")
    private String doubleVerificationUrl;

    @Value("${treasury-print-slip-url}")
    private String printSlipUrl;

    @Value("${treasury-transaction-details-url}")
    private String transactionDetailsUrl;

    @Value("${treasury-refund-request-url}")
    private String refundRequestUrl;

    @Value("${treasury-refund-status-url}")
    private String refundStatusUrl;

    @Value("${egov.collectionservice.host}")
    private String collectionServiceHost;

    @Value("${egov.collectionservice.payment.create}")
    private String collectionsPaymentCreatePath;

    @Value("${egov.file.store.treasury.module}")
    private String treasuryFileStoreModule;

    @Value("${egov.file.store.host}")
    private String fileStoreHost;

    @Value("${egov.file.store.save.endpoint}")
    private String fileStoreEndPoint;

    @Value("${egov.idgen.host}")
    private String idGenHost;

    @Value("${egov.idgen.path}")
    private String idGenPath;

    @Value("${egov.idgen.name}")
    private String idName;

    @Value("${egov.pdf.service.host}")
    private String pdfServiceHost;

    @Value("${egov.pdf.service.create.endpoint}")
    private String pdfServiceEndpoint;

    @Value("${egov.pdf.template.key}")
    private String pdfTemplateKey;

    @Value("${kafka.topic.create.treasury.payment.data}")
    private String saveTreasuryPaymentData;

    @Value(("${isTest.enabled}"))
    private boolean isTest;

    @Value("${challan.test.amount}")
    private String challanTestAmount;

    @Value("${pucar.tsb.account1.number}")
    private String tsbAccount1Number;

    @Value("${pucar.tsb.account2.number}")
    private String tsbAccount2Number;


    @Value("${pucar.tsb.account1.type}")
    private String tsbAccount1Type;

    @Value("${pucar.tsb.account2.type}")
    private String tsbAccount2Type;


    @Value("${pucar.tsb.receipt}")
    private String tsbReceipt;

    @Value("${treasury.head.ids}")
    private String heads;
    private List<String> headsList;

    @Value("${treasury.account.numbers}")
    private String accountNumber;
    private List<String> accountNumberList;

    @Value("${treasury.account.type}")
    private String accountType;
    private List<String> accountTypeList;

    @PostConstruct
    public void init() {
        headsList = Arrays.asList(heads.split(","));
        accountNumberList = Arrays.asList(accountNumber.split(","));
        accountTypeList = Arrays.asList(accountType.split(","));
    }


    @Value("${treasury.id.prefix}")
    private String treasuryIdPrefix;


}
