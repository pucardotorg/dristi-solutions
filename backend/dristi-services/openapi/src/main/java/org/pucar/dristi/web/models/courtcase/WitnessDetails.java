package org.pucar.dristi.web.models.courtcase;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.pucar.dristi.web.models.address.Emails;
import org.pucar.dristi.web.models.address.PartyAddress;
import org.pucar.dristi.web.models.address.PhoneNumbers;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class WitnessDetails {

    @JsonProperty("uniqueId")
    private String uniqueId;

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
    List<PartyAddress> addressDetails = new ArrayList<>();

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

    @JsonProperty("ownerType")
    private String ownerType;

    @JsonProperty("createdTime")
    private Long createdTime;

    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    @JsonProperty("uiData")
    private Map<String, Object> uiData = new HashMap<>();
}
