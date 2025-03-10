package org.egov.transformer.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.springframework.validation.annotation.Validated;

@Validated
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OpenHearing {

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("caseTitle")
    private String caseTitle = null;

    @JsonProperty("caseUuid")
    private String caseUuid = null;

    @JsonProperty("hearingNumber")
    private String hearingNumber = null;

    @JsonProperty("caseNumber")
    private String caseNumber = null;

    @JsonProperty("hearingUuid")
    private String hearingUuid = null;

    @JsonProperty("stage")
    private String stage = null;

    @JsonProperty("status")
    private String status = null;

    @JsonProperty("fromDate")
    private Long fromDate = null;

    @JsonProperty("toDate")
    private Long toDate = null;

}
