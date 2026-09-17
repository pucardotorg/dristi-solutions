package org.pucar.dristi.web.models.application;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.*;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.web.models.Pagination;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationSearchRequest {

    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("criteria")
    @Valid
    private ApplicationCriteria criteria = null;

    @JsonProperty("pagination")
    @Valid
    private Pagination pagination = null;

}
