package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.Valid;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdvocateCriteria {
    @JsonProperty("advocateSearchType")
    @Valid
    private AdvocateSearchType advocateSearchType; // "BAR_CODE" or "NAME"

    @JsonProperty("barCodeDetails")
    @Valid
    private BarCodeDetails barCodeDetails;

    @JsonProperty("advocateName")
    private String advocateName;
}
