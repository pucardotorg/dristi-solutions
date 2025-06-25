package org.egov.transformer.models;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class HearingCriteria {
    @NotBlank(message = "Hearing ID is required")
    @JsonProperty("hearingId")
    private String hearingId;

    @JsonProperty("hearingType")
    private String hearingType;

    @NotBlank(message = "CNR Number is required")
    @JsonProperty("cnrNumber")
    private String cnrNumber;

    @JsonProperty("filingNumber")
    private String filingNumber;

    @NotBlank(message = "Tenant ID is required")
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

