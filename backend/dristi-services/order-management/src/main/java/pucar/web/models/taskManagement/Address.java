package pucar.web.models.taskManagement;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Address {

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
}
