package org.pucar.dristi.web.models.address;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private List<AddressV2> addresses;
}
