package com.dristi.njdg_transformer.config;

import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class ServiceConstants {
    public static final String EXTERNAL_SERVICE_EXCEPTION = "External Service threw an Exception: ";
    public static final String SEARCHER_SERVICE_EXCEPTION = "Exception while fetching from searcher: ";
    public static final String ERROR_WHILE_FETCHING_FROM_MDMS = "ERROR_WHILE_FETCHING_FROM_MDMS";
    public static final String COMPLAINANT_PRIMARY = "complainant.primary";
    public static final String RESPONDENT_PRIMARY = "respondent.primary";
    public static final String ERROR_WHILE_FETCHING_FROM_ORDER = "ERROR_WHILE_FETCHING_FROM_ORDER";
    public static final String SIGNED_ORDER = "SIGNED";
    public static final String PUBLISHED_ORDER = "PUBLISHED";
    public static final String ACTIVE = "ACTIVE";
    public static final String ACT_NAME = "Negotiable Instruments Act%";
    public static final String JUDGE_DESIGNATION = "JUDICIAL_MAGISTRATE";
    public static final List<String> caseStatus = List.of("CASE_ADMITTED", "CASE_DISMISSED", "PENDING_RESPONSE");
    public static final String CONTESTED = "CONTESTED";
    public static final String UNCONTESTED = "UNCONTESTED";
    public static final String JUDGEMENT = "JUDGEMENT";
    public static final String COMPOSITE = "COMPOSITE";
    public static final String INTERMEDIATE = "INTERMEDIATE";
    public static final String COMPLETED = "COMPLETED";
    public static final String KOLLAM = "KOLLAM";
    public static final String CMP = "CMP";
    public static final String ST = "ST";
    public static final String ADMIT_DISMISS_CASE = "ADMIT_DISMISS_CASE";
    public static final String DISMISSED = "DISMISSED";
    public static final String DISMISS_CASE = "DISMISS_CASE";
    public static final String WITHDRAW_CASE = "WITHDRAWAL";
    public static final String WITHDRAWAL_ACCEPT = "WITHDRAWAL_ACCEPT";
    public static final String APPROVED = "APPROVED";
    public static final String SCHEDULE_OF_HEARING_DATE = "SCHEDULE_OF_HEARING_DATE";
    public static final String SCHEDULED = "SCHEDULED";
}
