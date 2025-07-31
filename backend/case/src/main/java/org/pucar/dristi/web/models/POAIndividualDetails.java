package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class POAIndividualDetails {
    @NotNull
    @JsonProperty("name")
    private String name;

    @NotNull
    @JsonProperty("individualId")
    private String individualId;

    @NotNull
    @JsonProperty("partyType")
    private String partyType;

    @NotNull
    @JsonProperty("userUuid")
    private String userUuid;

    @JsonProperty("isRevoking")
    private Boolean isRevoking = false;

    @JsonProperty("poaAuthDocument")
    @Valid
    private Document poaAuthDocument = null;

    @JsonProperty("revokeDocument")
    @Valid
    private Document revokeDocument = null;
}
