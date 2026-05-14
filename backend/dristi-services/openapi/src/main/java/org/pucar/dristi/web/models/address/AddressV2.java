package org.pucar.dristi.web.models.address;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AddressV2 {

    @JsonProperty("id")
    private String id;

    @JsonProperty("doorNo")
    private String doorNo;

    @JsonProperty("street")
    private String street;

    @JsonProperty("landmark")
    private String landmark;

    @JsonProperty("city")
    private String city;

    @JsonProperty("pincode")
    private String pincode;

    @JsonProperty("locality")
    private String locality;

    @JsonProperty("district")
    private String district;

    @JsonProperty("state")
    private String state;

    @JsonProperty("country")
    private String country;

    @JsonProperty("typeOfAddress")
    private AddressType typeOfAddress;

    @JsonProperty("coordinates")
    private Coordinates coordinates;

}
