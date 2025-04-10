package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;
import lombok.ToString;

@Data
@Builder
@ToString
public class PoliceStationDetails {

    @JsonProperty("police_station")
    private String station;

    @JsonProperty("police_station_code")
    private String code;

    @JsonProperty("name")
    private String name;

    @JsonProperty("district")
    private String district;

    @JsonProperty("active")
    private Boolean active;

}
