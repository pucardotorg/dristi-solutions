package org.pucar.dristi.web.models.courtcase;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.pucar.dristi.web.models.address.Address;
import org.pucar.dristi.web.models.address.PartyAddress;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RespondentDetails {

    @JsonProperty("uniqueId")
    private String uniqueId;

    @JsonProperty("firstName")
    private String firstName;

    @JsonProperty("lastName")
    private String lastName;

    @JsonProperty("middleName")
    private String middleName;

    @JsonProperty("partyType")
    private String partyType;

    @JsonProperty("partyIndex")
    private String partyIndex;

    @JsonProperty("email")
    private List<String> email;

    @JsonProperty("phone_numbers")
    private List<String> phoneNumbers;

    @JsonProperty("address")
    private List<Address> address;

    @JsonProperty("addressDetails")
    private List<PartyAddress> addressDetails;

    @JsonProperty("respondentType")
    private Object respondentType;

    @JsonProperty("respondentFirstName")
    private String respondentFirstName;

    @JsonProperty("respondentMiddleName")
    private String respondentMiddleName;

    @JsonProperty("respondentLastName")
    private String respondentLastName;

    @JsonProperty("respondentAge")
    private Integer respondentAge;

    @JsonProperty("companyDetailsUpload")
    private Object companyDetailsUpload;

    @JsonProperty("respondentVerification")
    private Object respondentVerification;

    @JsonProperty("inquiryAffidavitFileUpload")
    private Object inquiryAffidavitFileUpload;
}
