package org.pucar.dristi.web.models.advocateofficemember;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessCaseMemberResponse {

    @JsonProperty("ResponseInfo")
    private ResponseInfo responseInfo;

    @JsonProperty("processCaseMember")
    private ProcessCaseMember processCaseMember;
}
