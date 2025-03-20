package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
class AdvocateDetails {
    @NotNull
    @JsonProperty("barRegistrationNumber")
    private String barRegistrationNumber;

    @NotNull
    @JsonProperty("advocateId")
    private String advocateId;

    @NotNull
    @JsonProperty("advocateUserUuid")
    private String advocateUserUuid;

    @NotNull
    @JsonProperty("mobileNumber")
    private String mobileNumber;

    @NotNull
    @JsonProperty("requestedDate")
    private Long requestedDate;

    @NotNull
    @Valid
    @JsonProperty("individualDetails")
    private IndividualDetails individualDetails;
}
