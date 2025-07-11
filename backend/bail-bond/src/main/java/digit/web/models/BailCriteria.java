package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;
import org.springframework.validation.annotation.Validated;
@Validated
@Data
@Builder
public class BailCriteria {

    @JsonProperty("id")
    private String id = null;

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("caseId")
    private String caseId = null;

    @JsonProperty("bailType")
    private Bail.BailTypeEnum bailType = null;

    @JsonProperty("courtId")
    private String courtId = null;

    @JsonProperty("caseTitle")
    private String caseTitle = null;

    @JsonProperty("cnrNumber")
    private String cnrNumber = null;

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("caseType")
    private Bail.CaseTypeEnum caseType = null;

    @JsonProperty("bailId")
    private String bailId = null;
}
