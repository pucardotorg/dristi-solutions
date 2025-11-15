package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartyAddressRequest {

    @JsonProperty("uniqueId")
    private UUID uniqueId;

    @JsonProperty("partyType")
    private String partyType; //Accused, Witness

    @JsonProperty("addresses")
    private List<Address> addresses;
}
