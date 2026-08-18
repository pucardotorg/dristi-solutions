package org.pucar.dristi.web.models.advocateofficemember;

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
public class CaseMemberSearchRequest {

    @JsonProperty("RequestInfo")
    @NotNull
    @Valid
    private RequestInfo requestInfo;

    @JsonProperty("criteria")
    @NotNull
    @Valid
    private CaseMemberSearchCriteria criteria;

    @JsonProperty("pagination")
    @Valid
    private Pagination pagination;

}
