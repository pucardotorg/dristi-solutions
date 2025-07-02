package org.egov.transformer.models;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
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

    @AssertTrue(message = "fromDate must be less than or equal to toDate")
    private boolean isValidDateRange() {
        return fromDate == null || toDate == null || fromDate <= toDate;
    }

}

