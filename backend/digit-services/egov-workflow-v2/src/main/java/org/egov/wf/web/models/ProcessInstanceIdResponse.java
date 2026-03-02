package org.egov.wf.web.models;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProcessInstanceIdResponse {

    @JsonProperty("ResponseInfo")
    private ResponseInfo responseInfo;

    @JsonProperty("processInstanceIds")
    private List<String> processInstanceIds;

    @JsonProperty("totalCount")
    private Integer totalCount;

}
