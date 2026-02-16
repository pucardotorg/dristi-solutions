package com.dristi.njdg_transformer.model.cases;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.*;
import org.springframework.validation.annotation.Validated;


@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-18T11:14:11.072458+05:30[Asia/Calcutta]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Getter
@Setter
public class CaseOverallStatusType {

    @JsonProperty("id")
    @Valid
    private String id = null;

    @JsonProperty("action")
    @Valid
    private String action = null;

    @JsonProperty("state")
    @Valid
    private String state = null;

    @JsonProperty("workflowModule")
    @Valid
    private String workflowModule = null;

    @JsonProperty("typeIdentifier")
    @Valid
    private String typeIdentifier = null;

    @JsonProperty("stage")
    @Valid
    private String stage = null;

    @JsonProperty("substage")
    @Valid
    private String substage = null;

}
