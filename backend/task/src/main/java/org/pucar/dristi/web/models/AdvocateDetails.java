package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class AdvocateDetails {

    @JsonProperty("barRegistrationNumber")
    @NotNull
    private String barRegistrationNumber;

    @JsonProperty("advocateId")
    @NotNull
    private String advocateId;

    @JsonProperty("advocateUserUuid")
    @NotNull
    private String advocateUuid;

    @JsonProperty("mobileNumber")
    @NotNull
    private String mobileNumber;

    @JsonProperty("requestedDate")
    @NotNull
    private Long requestedDate;

    @JsonProperty("individualDetails")
    @NotNull
    private IndividualDetails individualDetails;
}