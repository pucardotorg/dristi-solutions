package com.dristi.njdg_transformer.model.inbox;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class InboxRequest {

    @JsonProperty("RequestInfo")
    private RequestInfo RequestInfo;

    @Valid
    @JsonProperty("inbox")
    private InboxSearchCriteria inbox ;
}
