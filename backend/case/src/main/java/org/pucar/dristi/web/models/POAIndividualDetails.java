package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class POAIndividualDetails {

    @JsonProperty("uniqueId")
    private String uniqueId;

    @NotNull
    @JsonProperty("individualId")
    private String individualId;

    @JsonProperty("isRevoking")
    private Boolean isRevoking = false;

    @JsonProperty("existingPoaIndividualId")
    private String existingPoaIndividualId = null;

    @JsonProperty("poaAuthDocument")
    @Valid
    private Document poaAuthDocument = null;
}
