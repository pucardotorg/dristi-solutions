package pucar.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import pucar.web.models.task.GeoLocationDetails;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Address {

    @JsonProperty("id")
    private String id;

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

    @JsonProperty("typeOfAddress")
    private Object typeOfAddress;

    @JsonProperty("coordinate")
    private CoordinateAddress coordinate;

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