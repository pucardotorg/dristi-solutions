package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.springframework.validation.annotation.Validated;

/**
 * SurveyTracker
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-10-14T19:19:54.104875784+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SurveyTracker {

    @JsonProperty("userUuid")
    @Valid
    @NotNull
    private String userUuid = null;

    @JsonProperty("tenantId")
    @Valid
    @NotNull
    private String tenantId = null;

    @JsonProperty("userType")
    @Valid
    private String userType = null;

    @JsonProperty("remindMeLater")
    @Valid
    private Boolean remindMeLater = null;

    @JsonProperty("lastTriggeredDate")
    @Valid
    private Long lastTriggeredDate = null;

    @JsonProperty("attempts")
    @Valid
    private Integer attempts = null;

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditDetails = null;

}
