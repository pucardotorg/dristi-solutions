package org.egov.transformer.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.validation.annotation.Validated;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CaseReferenceNumberUpdateRequest {

    @JsonProperty("requestInfo")
    private RequestInfo requestInfo = null;

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("cmpNumber")
    private String cmpNumber = null;

    @JsonProperty("courtCaseNumber")
    private String courtCaseNumber = null;

    @JsonProperty("caseTitle")
    private String caseTitle = null;

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("courtId")
    private String courtId = null;
}
