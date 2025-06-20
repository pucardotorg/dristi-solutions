package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.pucar.dristi.web.models.inbox.OrderBy;

import javax.validation.Valid;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LandingPageCaseListRequest {
    @JsonProperty("searchCaseCriteria")
    @Valid
    private SearchCaseCriteria searchCaseCriteria;

    @JsonProperty("filterCriteria")
    @Valid
    private FilterCriteria filterCriteria;

    @JsonProperty("offset")
    @Valid
    private Integer offset;

    @JsonProperty("limit")
    @Valid
    private Integer limit;

    @JsonProperty("sortOrder")
    @Valid
    private List<OrderBy> sortOrder;
}
