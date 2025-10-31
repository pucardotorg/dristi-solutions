package org.pucar.dristi.web.models.cases;

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

    @JsonProperty("doorNo")
    private String doorNo = null;

    @JsonProperty("street")
    private String street = null;

    @JsonProperty("landmark")
    private String landmark = null;

    @JsonProperty("city")
    private String city = null;

    @JsonProperty("pincode")
    private String pincode = null;

    @JsonProperty("locality")
    private String locality = null;

    @JsonProperty("district")
    private String district = null;

    @JsonProperty("state")
    private String state = null;

    @JsonProperty("country")
    private String country = null;
}