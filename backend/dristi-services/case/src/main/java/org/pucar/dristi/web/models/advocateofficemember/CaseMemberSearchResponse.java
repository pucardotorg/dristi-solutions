package org.pucar.dristi.web.models.advocateofficemember;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;
import org.pucar.dristi.web.models.Pagination;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CaseMemberSearchResponse {

    @JsonProperty("ResponseInfo")
    @Valid
    private ResponseInfo responseInfo;

    @JsonProperty("cases")
    @Valid
    private List<CaseMemberInfo> cases;

    @JsonProperty("totalCount")
    private Integer totalCount;

    @JsonProperty("pagination")
    @Valid
    private Pagination pagination;

}
