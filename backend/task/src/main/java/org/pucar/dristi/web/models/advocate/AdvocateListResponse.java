package org.pucar.dristi.web.models.advocate;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;
import org.pucar.dristi.web.models.Pagination;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AdvocateListResponse {
    @JsonProperty("responseInfo")
    @Valid
    private ResponseInfo responseInfo = null;

    @JsonProperty("advocates")
    @Valid
    private List<AdvocateSearchCriteria> advocates = null;

    @JsonProperty("pagination")

    @Valid
    private Pagination pagination = null;

}
