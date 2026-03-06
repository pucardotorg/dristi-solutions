package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import org.egov.common.contract.request.RequestInfo;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CtcApplicationRequest {
    
    @JsonProperty("RequestInfo")
    @NotNull
    private RequestInfo requestInfo;
    
    @JsonProperty("CtcApplication")
    private CtcApplication ctcApplication;
    
}
