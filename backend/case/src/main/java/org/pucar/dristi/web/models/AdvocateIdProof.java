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
public class AdvocateIdProof {

    @JsonProperty("name")
    private String name;

    @JsonProperty("fileName")
    private String fileName;

    @JsonProperty("fileStore")
    private String fileStore;

    @JsonProperty("documentName")
    private String documentName;
}
