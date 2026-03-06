package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IssueCtcDocumentUpdateResponse {

    @JsonProperty("responseInfo")
    private ResponseInfo responseInfo;

    @JsonProperty("ctcApplicationNumber")
    private String ctcApplicationNumber;

    @JsonProperty("id")
    private String id;

    @JsonProperty("docId")
    private String docId;
}
