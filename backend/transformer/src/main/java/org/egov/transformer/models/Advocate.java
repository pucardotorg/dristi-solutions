package org.egov.transformer.models;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Advocate {

    @JsonProperty("accused")
    private List<String> accused = null;

    @JsonProperty("complainant")
    private List<String> complainant = null;
}
