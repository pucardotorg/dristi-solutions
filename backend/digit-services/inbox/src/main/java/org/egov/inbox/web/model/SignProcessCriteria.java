package org.egov.inbox.web.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import javax.validation.constraints.NotNull;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SignProcessCriteria {

    @NotNull
    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("completeStatus")
    private List<String> completeStatus;

    @JsonProperty("orderType")
    private String orderType;

    @JsonProperty("deliveryChanel")
    private String deliveryChanel;

    @JsonProperty("applicationStatus")
    private String applicationStatus;

    @JsonProperty("isPendingCollection")
    private Boolean isPendingCollection;
}