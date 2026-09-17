package org.egov.eTreasury.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.egov.common.contract.response.ResponseInfo;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class ReconciliationV3TestResponse {

    private ResponseInfo responseInfo;

    /** True when the row was reconciled into a SUCCESS (status=Y) by this call. */
    private boolean processed;

    /** True when invoked in dry-run mode (no DB writes, no Kafka push). */
    private boolean dryRun;

    /** Whether an auth_sek_session_data row exists for the departmentId (set only when not dry-run). */
    private Boolean authSekFound;

    /** Whether Treasury returned an envelope at all. */
    private boolean envelopeReceived;

    /** Treasury status value from the decrypted payload (Y/N) when available. */
    private String treasuryStatus;

    /** Treasury-side error message from the decrypted payload, when present. */
    private String treasuryError;

    /** GRN from the decrypted payload, when present. */
    private String grn;

    /** Decrypted JSON payload (sliced to the JSON array) — useful for end-to-end debugging. */
    private String decryptedPayload;

    /** Human-readable message describing what the test endpoint did. */
    private String message;
}
