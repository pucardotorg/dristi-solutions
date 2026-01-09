package com.dristi.njdg_transformer.model.hearing;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class HearingUpdateBulkRequest {
    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo;

    @JsonProperty("hearings")
    @Valid
    private List<Hearing> hearings;
}
