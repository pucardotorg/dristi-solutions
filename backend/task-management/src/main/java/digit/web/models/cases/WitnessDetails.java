package digit.web.models.cases;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

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
    List<PartyAddresses> addressDetails = new ArrayList<>();

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
