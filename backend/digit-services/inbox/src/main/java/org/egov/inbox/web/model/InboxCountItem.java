package org.egov.inbox.web.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
public class InboxCountItem {

    @JsonProperty("inbox")
    private InboxSearchCriteria inbox;

    @JsonProperty("count")
    private Integer count;
}