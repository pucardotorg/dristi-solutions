package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class HearingCriteria {

    @JsonProperty("hearingId")
    private String hearingId;

    @JsonProperty("hearingType")
    private String hearingType;

    @JsonProperty("cnrNumber")
    private String cnrNumber;

    @JsonProperty("filingNumber")
    private String filingNumber;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("applicationNumber")
    private String applicationNumber;

    @JsonProperty("fromDate")
    private Long fromDate;

    @JsonProperty("toDate")
    private Long toDate;

    @JsonProperty("attendeeIndividualId")
    private String attendeeIndividualId;

    @JsonProperty("courtId")
    private String courtId;

}
