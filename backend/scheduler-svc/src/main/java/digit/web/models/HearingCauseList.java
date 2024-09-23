package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-25T11:13:21.813391200+05:30[Asia/Calcutta]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class HearingCauseList {

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("hearingType")
    private String hearingType = null;

    @JsonProperty("caseNumber")
    private String caseNumber = null;

    @JsonProperty("caseTitle")
    private String caseTitle = null;

    @JsonProperty("courtId")
    private String courtId = null;

    @JsonProperty("caseId")
    private String caseId = null;

    @JsonProperty("applicationNumber")
    private String applicationNumber = null;

    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;

    @JsonProperty("hearingDate")
    private Long hearingDate = null;

    @JsonProperty("hearingTimeInMinutes")
    private Long hearingTimeInMinutes = null;
}
