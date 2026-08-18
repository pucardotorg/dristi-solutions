package org.pucar.dristi.web.models.advocateoffice;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;
import org.pucar.dristi.web.models.Pagination;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MemberSearchRequest {

    @JsonProperty("RequestInfo")
    @NotNull
    @Valid
    private RequestInfo requestInfo;

    @JsonProperty("searchCriteria")
    @Valid
    private MemberSearchCriteria searchCriteria;

    @JsonProperty("pagination")
    @Valid
    private Pagination pagination;
}
