package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IssuedDocument {

    @JsonProperty("documentId")
    private String documentId;

    @JsonProperty("documentName")
    private String documentName;

    @JsonProperty("issuedDate")
    private Long issuedDate;

    @JsonProperty("approvalOrderId")
    private String approvalOrderId;

    @JsonProperty("fileStore")
    private String fileStore;

    @JsonProperty("documentCategory")
    private String documentCategory;

}