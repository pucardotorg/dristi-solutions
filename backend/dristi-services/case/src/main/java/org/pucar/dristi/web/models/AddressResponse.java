package org.pucar.dristi.web.models;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

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
    private Address addressDetails;

    @JsonProperty("auditDetails")
    private AuditDetails auditDetails;
}
