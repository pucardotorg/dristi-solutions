package org.egov.transformer.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Document {

    @JsonProperty("id")
    private String id = null;

    @JsonProperty("documentType")
    private String documentType = null;

    @JsonProperty("fileStore")
    private String fileStore = null;

    @JsonProperty("documentUid")
    private String documentUid = null;

    @JsonProperty("isActive")
    private boolean isActive = true;

    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;
}
