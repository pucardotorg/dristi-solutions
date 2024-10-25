package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;
import lombok.ToString;

@Data
@Builder
@ToString
public class LocationBasedJurisdiction {

    @JsonProperty("included_jurisdiction")
    private PoliceStationDetails includedJurisdiction;

    @JsonProperty("nearest_police_station")
    private PoliceStationDetails nearestPoliceStation;
}
