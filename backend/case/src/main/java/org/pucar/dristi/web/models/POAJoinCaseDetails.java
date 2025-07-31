package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class POAJoinCaseDetails {

    @Valid
    @JsonProperty("poaDetails")
    private POADetails poaDetails;

    @NotNull
    @Valid
    @JsonProperty("individualDetails")
    private List<POAIndividualDetails> individualDetails;
}
