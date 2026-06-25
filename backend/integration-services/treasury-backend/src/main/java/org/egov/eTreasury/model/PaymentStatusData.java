package org.egov.eTreasury.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;

/**
 * Payment status of a bill as seen by the UI. Built purely from stored state
 * (auth_sek_session_data + treasury_payment_data); no live treasury call is made.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class PaymentStatusData {

    private String billId;

    /** consumerCode of the bill; stored as service_number on the payment session. */
    private String serviceNumber;

    private PaymentStatusType status;

    private String businessService;

    private double totalDue;

    /** session_time of the most recent payment attempt for this bill, if any. */
    private Long lastAttemptTime;

    /** How a SUCCESS/FAILED was reached: CALLBACK, RECONCILIATION, RECONCILIATION_V3. */
    private String completionSource;

    private Long verificationTimestamp;

    // Receipt details, populated only when status == PAID.
    private String grn;

    private BigDecimal amount;

    private String partyName;

    private String fileStoreId;
}
