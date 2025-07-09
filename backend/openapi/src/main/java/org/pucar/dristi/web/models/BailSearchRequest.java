package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import java.util.List;
import java.util.ArrayList;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BailSearchRequest {
    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo;
    @JsonProperty("criteria")
    @Valid
    private List<BailCriteria> criteria = new ArrayList<>();
    @JsonProperty("pagination")
    @Valid
    private Pagination pagination;
    @JsonProperty("flow")
    private String flow;

    public BailSearchRequest addCriteriaItem(BailCriteria criteriaItem) {
        this.criteria.add(criteriaItem);
        return this;
    }
}
