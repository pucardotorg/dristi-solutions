package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.pucar.dristi.web.models.inbox.OrderBy;


import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LandingPageCaseListRequest {
    @JsonProperty("searchCaseCriteria")
    @Valid
    private SearchCaseCriteria searchCaseCriteria = null;

    @JsonProperty("filterCriteria")
    @Valid
    private FilterCriteria filterCriteria = null;

    @JsonProperty("offset")
    @Valid
    private Integer offset = null;

    @JsonProperty("limit")
    @Valid
    private Integer limit = null;

    @JsonProperty("sortOrder")
    @Valid
    private List<OrderBy> sortOrder = null;
}
