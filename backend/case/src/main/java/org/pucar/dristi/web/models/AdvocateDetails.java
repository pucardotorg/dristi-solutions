package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    private String barRegistrationNumber;

    @JsonProperty("name")
    private String name;

    @JsonProperty("advocateUuid")
    private String advocateUuid;

    @JsonProperty("mobileNumber")
    private String mobileNumber;

    @JsonProperty("requestedDate")
    private Long requestedDate;

}
