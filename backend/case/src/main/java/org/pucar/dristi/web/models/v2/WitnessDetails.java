package org.pucar.dristi.web.models.v2;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WitnessDetails {

    @JsonProperty("id")
    private String id;

    @JsonProperty("firstName")
    private String firstName;

    @JsonProperty("lastName")
    private String lastName;

    @JsonProperty("middleName")
    private String middleName;

    @JsonProperty("emails")
    private Emails emails;

    @JsonProperty("phonenumbers")
    private PhoneNumbers phoneNumbers;

    @JsonProperty("addressDetails")
    List<WitnessAddress> addressDetails = new ArrayList<>();

    @JsonProperty("witnessDesignation")
    private String witnessDesignation;

    @JsonProperty("witnessAge")
    private String witnessAge;

    @JsonProperty("witnessAdditionalDetails")
    private Object additionalDetails;

    @JsonProperty("dateOfService")
    private String dateOfService;

    @JsonProperty("witnessTag")
    private String witnessTag;
}
