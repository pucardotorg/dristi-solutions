package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.Data;

@Data
public class POARepresentingJoinCase {

    @JsonProperty("uniqueId")
    private String uniqueId = null;

    @JsonProperty("individualId")
    private String individualId = null;

    @JsonProperty("isRevoking")
    private Boolean isRevoking = false;

    @JsonProperty("poaAuthDocument")
    @Valid
    private Document poaAuthDocument = null;

    @JsonProperty("revokeDocument")
    @Valid
    private Document revokeDocument = null;
}
