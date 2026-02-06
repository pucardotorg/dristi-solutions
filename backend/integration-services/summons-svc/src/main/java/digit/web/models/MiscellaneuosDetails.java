package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MiscellaneuosDetails {

    @JsonProperty("issueDate")
    private Long issueDate;

    @JsonProperty("caseFilingDate")
    private Long caseFilingDate;

    @JsonProperty("nextHearingDate")
    private Long nextHearingDate;

    @JsonProperty("caseNumber")
    private String caseNumber;

    @JsonProperty("id")
    private String id = null;

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("courtId")
    private String courtId = null;

    @JsonProperty("isActive")
    private Boolean isActive = true;

    @JsonProperty("processTitle")
    private String processTitle = null;

    @JsonProperty("processText")
    private String processText = null;

    @JsonProperty("addresseeName")
    private String addresseeName = null;

    @JsonProperty("isCoverLetterRequired")
    @Valid
    private Boolean isCoverLetterRequired = false;

    @JsonProperty("addressee")
    @Valid
    private String addressee  = null;

    @JsonProperty("orderText")
    private String orderText = null;

    @JsonProperty("coverLetterText")
    private String coverLetterText = null;
}
