package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ValidateUserRequest {
    
    @JsonProperty("RequestInfo")
    private RequestInfo requestInfo;
    
    @JsonProperty("filingNumber")
    @NotBlank(message = "Filing number cannot be blank")
    private String filingNumber;
    
    @JsonProperty("mobileNumber")
    @NotBlank(message = "Mobile number cannot be blank")
    private String mobileNumber;
    
    @JsonProperty("tenantId")
    @NotBlank(message = "Tenant ID cannot be blank")
    private String tenantId;

    @JsonProperty("courtId")
    @NotBlank(message = "courtId cannot be blank")
    private String courtId;
}
