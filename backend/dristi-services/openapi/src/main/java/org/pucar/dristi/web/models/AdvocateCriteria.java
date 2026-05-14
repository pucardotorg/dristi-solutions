package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;



@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdvocateCriteria {
    @JsonProperty("advocateSearchType")
    @Valid
    private AdvocateSearchType advocateSearchType = null; // "BAR_CODE" or "NAME"

    @JsonProperty("barCodeDetails")
    @Valid
    private BarCodeDetails barCodeDetails = null;

    @JsonProperty("advocateName")
    private String advocateName = null;
}
