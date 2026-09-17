package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

@Validated
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Profile {

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("uuid")
    private String id;

    @JsonProperty("litigantDetails")
    private Object litigantDetails;

    @JsonProperty("editorDetails")
    private Object editorDetails;

    @JsonProperty("pendingTaskRefId")
    private String pendingTaskRefId;

    @JsonProperty("newData")
    private Object newData;

    @JsonProperty("caseId")
    private String caseId;

    @JsonProperty("document")
    private Document document;

    @JsonProperty("reason")
    private String reason;
}
