package org.pucar.dristi.web.models.advocateofficemember;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;

import jakarta.validation.constraints.NotNull;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MemberAdvocatesRequest {

    @JsonProperty("RequestInfo")
    private RequestInfo requestInfo;

    @JsonProperty("memberUserUuid")
    @NotNull
    private String memberUserUuid;

    @JsonProperty("caseId")
    @NotNull
    private String caseId;
}
