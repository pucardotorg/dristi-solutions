package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BarCodeDetails {
    @JsonProperty("stateCode")
    private String stateCode = null;

    @JsonProperty("barCode")
    private String barCode = null;

    @JsonProperty("year")
    private String year = null;
}
