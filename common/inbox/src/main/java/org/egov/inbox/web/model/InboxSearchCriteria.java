package org.egov.inbox.web.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.egov.inbox.web.model.workflow.ProcessInstanceSearchCriteria;

import javax.validation.Valid;
import javax.validation.constraints.Max;
import javax.validation.constraints.NotNull;
import java.util.HashMap;
import java.util.List;


@Data
public class InboxSearchCriteria {

    @NotNull
    @JsonProperty("tenantId")
    private String tenantId;

    @Valid
    @JsonProperty("processSearchCriteria")
    private ProcessInstanceSearchCriteria processSearchCriteria;

    @JsonProperty("moduleSearchCriteria")
    private HashMap<String, Object> moduleSearchCriteria;

    @JsonProperty("orderBy")
    @Valid
    private List<OrderBy> sortOrder;

    @JsonProperty("offset")
    private Integer offset;

    @JsonProperty("limit")
    @Max(value = 300)
    private Integer limit;
}
