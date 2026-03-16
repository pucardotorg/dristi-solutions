package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Address {

    @JsonProperty("locality")
    private String locality;

    @JsonProperty("city")
    private String city;

    @JsonProperty("district")
    private String district;

    @JsonProperty("state")
    private String state;

    @JsonProperty("pincode")
    private String pinCode;

    @JsonProperty("coordinate")
    private Coordinate coordinate;

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
