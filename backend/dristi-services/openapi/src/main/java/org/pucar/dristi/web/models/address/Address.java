package org.pucar.dristi.web.models.address;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Address {

    @JsonProperty("state")
    private String state;

    @JsonProperty("city")
    private String city;

    @JsonProperty("district")
    private String district;

    @JsonProperty("pincode")
    private String pinCode;

    @JsonProperty("locality")
    private String locality;


    @JsonProperty("coordinate")
    private Coordinates coordinates;

    @JsonProperty("geoLocationDetails")
    private GeoLocationDetails geoLocationDetails;

    @Override
    public String toString() {
        return String.join(", ",
                state != null ? state : "",
                city != null ? city : "",
                district != null ? district : "",
                pinCode != null ? pinCode : "",
                locality != null ? locality : ""
        );
    }


}
