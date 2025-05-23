package org.pucar.dristi.web.models.v2;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.util.UUID;

/**
 * Party
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-15T11:31:40.281899+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LitigantV2 {

    @JsonProperty("id")
    private UUID id = null;

    @JsonProperty("individualId")
    private String individualId = null;

    @JsonProperty("partyType")
    private String partyType = null;

    @JsonProperty("isPartyInPerson")
    private boolean isPartyInPerson;

    @JsonProperty("isResponseSubmitted")
    private boolean isResponseSubmitted;

}
