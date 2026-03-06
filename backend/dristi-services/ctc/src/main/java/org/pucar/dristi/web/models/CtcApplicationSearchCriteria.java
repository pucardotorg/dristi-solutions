package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CtcApplicationSearchCriteria {
    
    @JsonProperty("tenantId")
    @Valid
    @NotNull
    private String tenantId;
    
    @JsonProperty("ctcApplicationNumber")
    private String ctcApplicationNumber;

    @JsonProperty("filingNumber")
    @Valid
    private String filingNumber;
    
    @JsonProperty("searchByCaseNumberAnTitle")
    private String searchByCaseNumberAnTitle;
    
    @JsonProperty("courtId")
    @Valid
    private String courtId;
    
    @JsonProperty("status")
    private String status;
}
