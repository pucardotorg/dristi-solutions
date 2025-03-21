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
public class ReplacementAdvocateDetails {
    @NotNull
    @JsonProperty("barRegistrationNumber")
    private String barRegistrationNumber;

    @NotNull
    @JsonProperty("name")
    private String name;

    @NotNull
    @JsonProperty("advocateUuid")
    private String advocateUuid;

    @NotNull
    @JsonProperty("mobileNumber")
    private String mobileNumber;

    @NotNull
    @JsonProperty("userUuid")
    private String userUuid;
}
