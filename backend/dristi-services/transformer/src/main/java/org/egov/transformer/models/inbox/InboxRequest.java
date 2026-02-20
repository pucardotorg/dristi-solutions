package org.egov.transformer.models.inbox;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;

import javax.validation.Valid;

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
