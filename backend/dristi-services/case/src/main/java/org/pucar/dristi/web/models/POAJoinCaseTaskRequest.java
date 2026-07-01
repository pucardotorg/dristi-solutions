package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class POAJoinCaseTaskRequest {

    @JsonProperty("poaDetails")
    private POADetails poaDetails;

    @JsonProperty("individualDetails")
    private List<POAIndividualDetails> individualDetails;
}
