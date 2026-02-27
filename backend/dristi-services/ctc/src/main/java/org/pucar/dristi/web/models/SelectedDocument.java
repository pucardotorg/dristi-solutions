package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SelectedDocument {

    @JsonProperty("documentId")
    private String documentId;

    @JsonProperty("fileStore")
    private String fileStore;

    @JsonProperty("documentName")
    private String documentName;

    @JsonProperty("documentCategory")
    private String documentCategory;

    @JsonProperty("numberOfCopies")
    private Integer numberOfCopies;

    @JsonProperty("pages")
    private Integer pages;
}