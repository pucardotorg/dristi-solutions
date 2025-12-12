package org.pucar.dristi.web.models.advocate;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AdvocateSearchRequest {
    @JsonProperty("RequestInfo")
    @javax.validation.Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("criteria")
    @Valid
    private List<AdvocateSearchCriteria> criteria = new ArrayList<>();

    public AdvocateSearchRequest addCriteriaItem(AdvocateSearchCriteria criteriaItem) {
        this.criteria.add(criteriaItem);
        return this;
    }

}
