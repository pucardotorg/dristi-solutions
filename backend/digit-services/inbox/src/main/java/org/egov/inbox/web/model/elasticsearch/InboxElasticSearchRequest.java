package org.egov.inbox.web.model.elasticsearch;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.egov.common.contract.request.RequestInfo;

import javax.validation.Valid;

;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class InboxElasticSearchRequest {
  @JsonProperty("RequestInfo")
  private RequestInfo requestInfo;

  @Valid
  @JsonProperty("InboxElasticSearchCriteria")
  private InboxElasticSearchCriteria inboxElasticSearchCriteria ;



}