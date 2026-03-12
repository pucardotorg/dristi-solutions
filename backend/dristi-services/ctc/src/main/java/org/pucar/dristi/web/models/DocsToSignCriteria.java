package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DocsToSignCriteria {

    @JsonProperty("fileStoreId")
    private String fileStoreId;

    @JsonProperty("docId")
    private String docId;

    @JsonProperty("docTitle")
    private String docTitle;

    @JsonProperty("ctcApplicationNumber")
    private String ctcApplicationNumber;

    @JsonProperty("filingNumber")
    private String filingNumber;

    @JsonProperty("courtId")
    private String courtId;

    @JsonProperty("placeholder")
    private String placeholder;

    @JsonProperty("tenantId")
    private String tenantId;
}
