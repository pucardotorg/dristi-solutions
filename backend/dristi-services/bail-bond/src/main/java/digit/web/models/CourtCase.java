package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CourtCase {

    @JsonProperty("id")
    @Valid
    private UUID id = null;

    @JsonProperty("tenantId")
    @NotNull
    private String tenantId = null;

    @JsonProperty("caseTitle")
    private String caseTitle = null;

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("courtCaseNumber")
    private String courtCaseNumber = null;

    @JsonProperty("caseNumber")
    private String caseNumber = null;

    @JsonProperty("caseType")
    private String caseType = null;

    @JsonProperty("cnrNumber")
    private String cnrNumber = null;

    @JsonProperty("cmpNumber")
    private String cmpNumber = null;

    @JsonProperty("courtId")
    private String courtId = null;

    @JsonProperty("status")
    private String status = null;

    @JsonProperty("advocateOffices")
    @Valid
    @Builder.Default
    private List<AdvocateOffice> advocateOffices = new ArrayList<>();

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditdetails = null;
}
