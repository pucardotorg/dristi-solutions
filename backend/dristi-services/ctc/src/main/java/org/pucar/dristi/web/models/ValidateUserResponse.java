package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ValidateUserResponse {
    
    @JsonProperty("ResponseInfo")
    private ResponseInfo responseInfo;
    
    @JsonProperty("validateUserInfo")
    private ValidateUserInfo validateUserInfo;
}
