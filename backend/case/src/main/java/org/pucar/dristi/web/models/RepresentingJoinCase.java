package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RepresentingJoinCase {

    @JsonProperty("uniqueId")
    private String uniqueId = null;

    @JsonProperty("individualId")
    private String individualId = null;

    @JsonProperty("isReplacing")
    private Boolean isReplacing = false;

    @JsonProperty("isAlreadyPip")
    private Boolean isAlreadyPip = false;

    @JsonProperty("advocateUUID")
    private String advocateUUID = null;

    @JsonProperty("documents")
    @Valid
    private List<Document> documents = null;

    @JsonProperty("replaceAdvocates")
    private List<String> replaceAdvocates = null;

}
