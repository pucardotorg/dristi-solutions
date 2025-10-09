package com.dristi.njdg_transformer.config;

import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;

@Component
public class ServiceConstants {
    public static final String EXTERNAL_SERVICE_EXCEPTION = "External Service threw an Exception: ";
    public static final String SEARCHER_SERVICE_EXCEPTION = "Exception while fetching from searcher: ";
    public static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    public static final String ERROR_WHILE_FETCHING_FROM_MDMS = "ERROR_WHILE_FETCHING_FROM_MDMS";
    public static final String COMPLAINANT_PRIMARY = "complainant.primary";
    public static final String RESPONDENT_PRIMARY = "respondent.primary";
    public static final String ERROR_WHILE_FETCHING_FROM_ADVOCATE = "ERROR_WHILE_FETCHING_FROM_ADVOCATE";
    public static final String NJDG_MODULE ="NJDG";
    public static final String PURPOSE_MASTER = "HearingPurpose";
    public static final String ACT_MASTER = "Act";
}
