package org.egov.user.persistence.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.egov.common.contract.request.RequestInfo;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActionRequest {

    @JsonProperty("RequestInfo")
    private RequestInfo requestInfo;

    @JsonProperty("roleCodes")
    private List<String> roleCodes;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("actionMaster")
    private String actionMaster;
}