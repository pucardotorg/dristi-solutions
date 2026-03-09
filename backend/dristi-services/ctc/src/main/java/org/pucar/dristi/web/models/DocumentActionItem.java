package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentActionItem {

    @JsonProperty("docId")
    @NotBlank
    private String docId;

    @JsonProperty("ctcApplicationNumber")
    @NotBlank
    private String ctcApplicationNumber;

    @JsonProperty("filingNumber")
    @NotBlank
    private String filingNumber;
}
