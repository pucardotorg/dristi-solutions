package org.pucar.dristi.web.models.witnessdeposition;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;
import org.pucar.dristi.web.models.Pagination;
import org.springframework.validation.annotation.Validated;

import java.util.List;
@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EvidenceSearchResponse {
    @JsonProperty("ResponseInfo")
    private ResponseInfo responseInfo;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("artifacts")
    private List<Artifact> artifacts;
    @JsonProperty("pagination")
    @Valid
    private Pagination pagination = null;

}

