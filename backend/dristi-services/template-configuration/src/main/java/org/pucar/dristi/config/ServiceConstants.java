package org.pucar.dristi.config;


import org.springframework.stereotype.Component;


@Component
public class ServiceConstants {

    private ServiceConstants() {
    }

    public static final String EXTERNAL_SERVICE_EXCEPTION = "External Service threw an Exception: ";
    public static final String TEMPLATE_UPDATE_EXCEPTION = "TEMPLATE_UPDATE_EXCEPTION";
    public static final String TEMPLATE_CREATE_EXCEPTION = "TEMPLATE_CREATE_EXCEPTION";
    public static final String TEMPLATE_SEARCH_EXCEPTION = "TEMPLATE_SEARCH_EXCEPTION";
    public static final String SEARCHER_SERVICE_EXCEPTION = "Exception while fetching from searcher: ";

    public static final String SUCCESSFUL = "successful";
    public static final String FAILED = "failed";

}
