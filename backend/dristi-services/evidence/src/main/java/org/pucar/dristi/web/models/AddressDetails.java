package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AddressDetails {

    @JsonProperty("city")
    private String city;

    @JsonProperty("state")
    private String state;

    @JsonProperty("pincode")
    private String pincode;

    @JsonProperty("district")
    private String district;

    @JsonProperty("locality")
    private String locality;

    @JsonProperty("coordinates")
    private Coordinates coordinates;

    @JsonProperty("typeOfAddress")
    private AddressType typeOfAddress;
}

