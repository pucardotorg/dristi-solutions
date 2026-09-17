package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import digit.models.coremodels.AuditDetails;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class JudgeCalendarRule {

    @JsonProperty("id")
    private String id;

    @JsonProperty("judgeId")
    private String judgeId;

    @JsonProperty("ruleType")
    private String ruleType;

    @JsonProperty("date")
    private Long date;

    @JsonProperty("notes")
    private String notes;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("courtIds")
    private List<String> courtIds;

    @JsonProperty("auditDetails")
    private AuditDetails auditDetails;

    @JsonProperty("rowVersion")
    private Integer rowVersion = null;
}
