package com.dristi.njdg_transformer.model.cases;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.*;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;


@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-18T11:14:11.072458+05:30[Asia/Calcutta]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Getter
@Setter
public class CaseOutcomeType {

    @JsonProperty("id")
    @Valid
    private String id = null;

    @JsonProperty("orderType")
    @Valid
    private String orderType = null;

    @JsonProperty("outcome")
    @Valid
    private String outcome = null;

    @JsonProperty("isJudgement")
    @Valid
    private Boolean isJudgement = null;

    @JsonProperty("judgementList")
    @Valid
    private List<String> judgementList = new ArrayList<>();
}
