package digit.web.models.scheduler;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.springframework.validation.annotation.Validated;

@Validated
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

    @JsonProperty("auditDetails")
    private AuditDetails auditDetails;

    @JsonProperty("rowVersion")
    private Integer rowVersion = null;
}
