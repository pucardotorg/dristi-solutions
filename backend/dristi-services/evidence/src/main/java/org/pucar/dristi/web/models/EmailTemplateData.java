package org.pucar.dristi.web.models;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EmailTemplateData {
    private String caseNumber;
    private String caseName;
    private String shortenedURL;
    private String tenantId;
    private String artifactNumber;
    private String filingNumber;
}
