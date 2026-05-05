package org.pucar.dristi.web.models.bailbond;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.web.models.Pagination;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.Builder;

/**
 * BailSearchRequest
 */
@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BailSearchRequest {
    @JsonProperty("RequestInfo")

    @Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("criteria")
    private BailSearchCriteria criteria = null;

    @JsonProperty("pagination")
    @Valid
    private Pagination pagination = null;


}
