package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SuretySearchResponse {
    @JsonProperty("ResponseInfo")
    private ResponseInfo responseInfo;
    @JsonProperty("sureties")
    private List<Surety> sureties;
}
