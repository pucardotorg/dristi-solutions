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

    @JsonProperty("advocateId")
    private String advocateId;

    @JsonProperty("advocateUuid")
    private String advocateUuid;

    @JsonProperty("mobileNumber")
    private String mobileNumber;

    @JsonProperty("requestedDate")
    private Long requestedDate;

    @JsonProperty("individualDetails")
    private IndividualDetails individualDetails;

    @JsonProperty("Document")
    private Document document;

    @JsonProperty("individualId")
    private String individualId;

}
