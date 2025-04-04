package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
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
public class JoinCaseRepresentative {

    @JsonProperty("isJudgeApproving")
    private Boolean isJudgeApproving = false;

    @JsonProperty("isReplacing")
    private Boolean isReplacing = false;

    @JsonProperty("advocateId")
    private String advocateId = null;

    @JsonProperty("reason")
    private String reason = null;

    @JsonProperty("reasonDocument")
    @Valid
    private ReasonDocument reasonDocument = null;

    @JsonProperty("representing")
    private List<RepresentingJoinCase> representing = null;
}
