package org.egov.eTreasury.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class IndividualSearch {

    @JsonProperty("id")
    private List<String> id = null;

    @JsonProperty("individualId")
    private String individualId = null;

    @JsonProperty("userUuid")
    @Size(min = 1)
    private List<String> userUuid;

}
