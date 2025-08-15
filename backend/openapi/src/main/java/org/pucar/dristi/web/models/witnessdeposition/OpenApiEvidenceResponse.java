package org.pucar.dristi.web.models.witnessdeposition;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.Document;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OpenApiEvidenceResponse {

    @JsonProperty("artifactNumber")
    private String artifactNumber;

    @JsonProperty("mobileNumber")
    private String mobileNumber;

    @JsonProperty("sourceType")
    private String sourceType = null;

    @JsonProperty("tag")
    private String tag = null;

    @JsonProperty("status")
    private String status = null;

    @JsonProperty("file")
    private Document file = null;

}
