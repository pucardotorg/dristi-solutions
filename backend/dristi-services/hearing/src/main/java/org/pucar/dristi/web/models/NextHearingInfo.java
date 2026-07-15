package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NextHearingInfo {

    @JsonProperty("hearingNumber")
    private String hearingNumber;

    @JsonProperty("caseId")
    private String caseId;

    @JsonProperty("filingNumber")
    private String filingNumber;

    @JsonProperty("fromDate")
    private Long fromDate;
}
