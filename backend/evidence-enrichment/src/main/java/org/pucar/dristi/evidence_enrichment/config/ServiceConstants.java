package org.pucar.dristi.evidence_enrichment.config;

import org.springframework.stereotype.Component;

@Component
public class ServiceConstants {

    private ServiceConstants() {
    }
    public static final String EXTERNAL_SERVICE_EXCEPTION = "External Service threw an Exception: ";
    public static final String SEARCHER_SERVICE_EXCEPTION = "Exception while fetching from searcher: ";
    public static final String APPLICATION = "APPLICATION";
}
