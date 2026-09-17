package org.egov.eTreasury.model;

/**
 * High level payment state for a bill, derived from the auth_sek_session_data rows.
 * Used by the UI (via /payment/v1/_paymentStatus) to decide whether the user still
 * needs to pay, preventing duplicate payments.
 */
public enum PaymentStatusType {

    /** No payment session has ever been created for this bill. Safe to pay. */
    NO_ATTEMPT,

    /** At least one session is marked SUCCESS. Already paid; UI should block re-payment. */
    PAID,

    /** A session is still PENDING (callback not received, not yet reconciled). UI should
     *  ask the user to wait rather than pay again. */
    VERIFICATION_PENDING,

    /** All sessions reached a terminal non-success state. Safe to retry payment. */
    FAILED
}
