package org.pucar.dristi.web.models.docpreview;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;
import org.pucar.dristi.web.models.CaseBundleNode;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocPreviewResponse {

    @NotNull
    private ResponseInfo responseInfo;

    @NotBlank
    @JsonProperty("caseBundleNodes")
    private List<CaseBundleNode> caseBundleNodes;

}
