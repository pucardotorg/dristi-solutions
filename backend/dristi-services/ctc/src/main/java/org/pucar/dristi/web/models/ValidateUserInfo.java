package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ValidateUserInfo {
    
    @JsonProperty("userName")
    private String userName;

    @JsonProperty("designation")
    private String designation;
    
    @JsonProperty("mobileNumber")
    private String mobileNumber;
    
    @JsonProperty("filingNumber")
    private String filingNumber;
    
    @JsonProperty("courtId")
    private String courtId;

    @JsonProperty("isPartyToCase")
    @NotNull
    private Boolean isPartyToCase = false;
}
