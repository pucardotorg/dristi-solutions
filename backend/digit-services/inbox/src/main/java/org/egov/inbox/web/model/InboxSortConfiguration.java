package org.egov.inbox.web.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class InboxSortConfiguration {

    @JsonProperty("module")
    private String module;

    @JsonProperty("index")
    private String index;

    @JsonProperty("sortBy")
    List<SortOrder> sortOrder;

}
