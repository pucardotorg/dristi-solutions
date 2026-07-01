package org.egov.eTreasury.model;

/**
 * Outcome of reconciling a single aged PENDING row via the V3 endpoint.
 * <p>
 * The batch is driven by an external K8s CronJob (every ~30 min); there is no in-process retry.
 * Each run resolves a row to a terminal state ({@code RECONCILED} or {@code FAILED_TERMINAL}) as
 * soon as treasury gives a definitive answer. {@code INCONCLUSIVE} means treasury could not be
 * reached/parsed this time, so the row is left PENDING for the next cron cycle to look at again —
 * we deliberately do NOT mark such a row FAILED, to avoid failing a payment that may have succeeded.
 */
public enum ReconcileV3Outcome {
    /** Treasury reported status=Y; row was reconciled into a SUCCESS. */
    RECONCILED,
    /** Treasury gave a definitive non-success (status=N/other); row marked terminal FAILED. */
    FAILED_TERMINAL,
    /** Treasury could not be reached/parsed; row left PENDING for the next cron cycle. */
    INCONCLUSIVE,
    /**
     * Treasury reported a pending status (G = no bank update yet, or P = bank-reported pending below
     * the retry limit); the row is deliberately left PENDING for the next cron cycle. Distinct from
     * INCONCLUSIVE, which means treasury could not be reached/parsed at all.
     */
    PENDING_RETRY
}
