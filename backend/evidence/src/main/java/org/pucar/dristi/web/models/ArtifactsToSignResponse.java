package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ArtifactsToSignResponse {
    @JsonProperty("ResponseInfo")
    @Valid
    private ResponseInfo responseInfo = null;

    @JsonProperty("artifactList")
    @Valid
    private List<ArtifactToSign> artifactList = null;

    public ArtifactsToSignResponse addArtifactListItem(ArtifactToSign artifactListItem) {
        if (this.artifactList == null) {
            this.artifactList = new ArrayList<>();
        }
        this.artifactList.add(artifactListItem);
        return this;
    }
}
