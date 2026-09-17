package org.pucar.dristi.web.models.address;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.pucar.dristi.web.models.AuditDetails;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddressResponse {

    @JsonProperty("id")
    private UUID id;

    @JsonProperty("individualId")
    private UUID individualId;

    @JsonProperty("addressDetails")
    private AddressV2 addressDetails;

    @JsonProperty("auditDetails")
    private AuditDetails auditDetails;
}
