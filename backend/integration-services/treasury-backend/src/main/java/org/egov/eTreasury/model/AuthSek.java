package org.egov.eTreasury.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AuthSek {

    private String authToken;
    private String decryptedSek;
    private String billId;
    private String businessService;
    private String serviceNumber;
    private double totalDue;
    private String mobileNumber;
    private String paidBy;
    private long sessionTime;
    private String departmentId;
    private Object requestBlob;
    private PaymentStatus paymentStatus;
    private String completionSource;
    private Long verificationTimestamp;
    private String processedStatus;
    /** Number of times V3 reconciliation has seen treasury status=P (bank-reported "Pending") for this row. */
    private Integer retryCount;
}