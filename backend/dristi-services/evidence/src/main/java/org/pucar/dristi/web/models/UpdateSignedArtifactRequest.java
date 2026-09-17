package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;
import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdateSignedArtifactRequest {
    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("signedArtifacts")
    @Valid
    private List<SignedArtifact> signedArtifacts = null;

    public UpdateSignedArtifactRequest addSignedArtifactsItem(SignedArtifact signedArtifactsItem) {
        if (this.signedArtifacts == null) {
            this.signedArtifacts = new ArrayList<>();
        }
        this.signedArtifacts.add(signedArtifactsItem);
        return this;
    }
}
