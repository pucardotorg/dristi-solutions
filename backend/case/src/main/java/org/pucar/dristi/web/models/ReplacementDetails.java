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
public class ReplacementDetails {

    @JsonProperty("advocateDetails")
    private AdvocateDetails advocateDetails;

    @JsonProperty("litigantDetails")
    private LitigantDetails litigantDetails;

    @JsonProperty("isLitigantPip")
    private Boolean isLitigantPip;
}
