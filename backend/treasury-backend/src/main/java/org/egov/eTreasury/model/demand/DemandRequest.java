package org.egov.eTreasury.model.demand;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandRequest {

    @NotNull
    @JsonProperty("RequestInfo")
    private RequestInfo requestInfo;

    @Valid
    @NotNull
    @Builder.Default
    @JsonProperty("Demands")
    private List<Demand> demands = new ArrayList<>();
}
