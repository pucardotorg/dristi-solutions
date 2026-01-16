package org.pucar.dristi.web.models.advocate;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AdvocateSearchCriteria {
    @JsonProperty("id")
    private String id = null;

    @JsonProperty("barRegistrationNumber")
    private String barRegistrationNumber = null;

    @JsonProperty("applicationNumber")
    private String applicationNumber = null;

    @JsonProperty("individualId")
    private String individualId = null;

    @JsonProperty("responseList")
    @Valid
    private List<Advocate> responseList = null;

}

