package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

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
    private Coordinate coordinate;

    @JsonProperty("geoLocationDetails")
    private GeoLocationDetails geoLocationDetails;

    @Override
    public String toString() {
        return java.util.stream.Stream.of(locality, city, district, state, pinCode)
                .filter(value -> value != null && !value.isBlank())
                .collect(java.util.stream.Collectors.joining(", "));
    }


}
