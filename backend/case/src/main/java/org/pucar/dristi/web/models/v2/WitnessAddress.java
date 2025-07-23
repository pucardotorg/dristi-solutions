package org.pucar.dristi.web.models.v2;

import com.fasterxml.jackson.annotation.JsonProperty;

public class WitnessAddress {
    @JsonProperty("addressDetails")
    private AddressDetails addressDetails;
}
