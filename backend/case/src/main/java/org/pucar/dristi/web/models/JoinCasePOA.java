package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class JoinCasePOA {

    @JsonProperty("individualId")
    private String individualId = null;

    @JsonProperty("poaRepresenting")
    private List<POARepresentingJoinCase> poaRepresenting = null;
}
