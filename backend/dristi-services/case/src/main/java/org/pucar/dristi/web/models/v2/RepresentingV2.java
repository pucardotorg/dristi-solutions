package org.pucar.dristi.web.models.v2;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.egov.common.contract.models.AuditDetails;
import org.pucar.dristi.web.models.Document;
import org.springframework.validation.annotation.Validated;

import java.util.List;
import java.util.UUID;

/**
 * Party
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-15T11:31:40.281899+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
public class RepresentingV2 {

    @JsonProperty("individualId")
    private String individualId = null;

    @JsonProperty("partyType")
    private String partyType = null;

}
