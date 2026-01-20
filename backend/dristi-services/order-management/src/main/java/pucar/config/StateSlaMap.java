package pucar.config;

import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class StateSlaMap {

    // can be replace with mdms
    private static final Map<String, Integer> STATE_SLA_MAP;

    static {

        STATE_SLA_MAP = Map.ofEntries(
                Map.entry("SECTION_202_CRPC", 3),
                Map.entry("MANDATORY_SUBMISSIONS_RESPONSES", 3),
                Map.entry("EXTENSION_OF_DOCUMENT_SUBMISSION_DATE", 3),
                Map.entry("REFERRAL_CASE_TO_ADR", 3),
                Map.entry("SCHEDULE_OF_HEARING_DATE", 3),
                Map.entry("RESCHEDULE_OF_HEARING_DATE", 3),
                Map.entry("REJECTION_RESCHEDULE_REQUEST", 3),
                Map.entry("APPROVAL_RESCHEDULE_REQUEST", 3),
                Map.entry("INITIATING_RESCHEDULING_OF_HEARING_DATE", 1),
                Map.entry("ASSIGNING_DATE_RESCHEDULED_HEARING", 3),
                Map.entry("ASSIGNING_NEW_HEARING_DATE", 3),
                Map.entry("CASE_TRANSFER", 3),
                Map.entry("SETTLEMENT", 3),
                Map.entry("SUMMONS", 3),
                Map.entry("NOTICE", 3),
                Map.entry("BAIL", 3),
                Map.entry("WARRANT", 3),
                Map.entry("WITHDRAWAL", 3),
                Map.entry("OTHERS", 3),
                Map.entry("APPROVE_VOLUNTARY_SUBMISSIONS", 3),
                Map.entry("REJECT_VOLUNTARY_SUBMISSIONS", 3),
                Map.entry("REJECT_BAIL", 3),
                Map.entry("ACCEPT_BAIL", 3),
                Map.entry("SET_BAIL_TERMS", 3),
                Map.entry("JUDGEMENT", 3),
                Map.entry("CHECKOUT_ACCEPTANCE", 1),
                Map.entry("CHECKOUT_REJECT", 1),
                Map.entry("SCHEDULE_HEARING", 3),
                Map.entry("ATTACHMENT", 3),
                Map.entry("PROCLAMATION", 3)
        );
    }

    public static Map<String, Integer> getStateSlaMap() {
        return STATE_SLA_MAP;
    }
}
