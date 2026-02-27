package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    private String tenantId;
    
    @JsonProperty("ctcApplicationNumber")
    private String ctcApplicationNumber;
    
    @JsonProperty("searchByCaseNumberAnTitle")
    private String searchByCaseNumberAnTitle;
    
    @JsonProperty("courtId")
    private String courtId;
    
    @JsonProperty("status")
    private String status;
}
