package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CaseDiaryEntry {
    @JsonProperty("id")

    @Valid
    private UUID id = null;

    @JsonProperty("tenantId")
    @NotNull

    private String tenantId = null;

    @JsonProperty("entryDate")
    @NotNull

    private Long entryDate = null;

    @JsonProperty("caseNumber")

    private String caseNumber = null;

    @JsonProperty("caseId")
    private String caseId = null;

    @JsonProperty("courtId")
    @NotNull

    private String courtId = null;

    @JsonProperty("businessOfDay")
    @NotNull

    @Size(max = 1024)
    private String businessOfDay = null;

    @JsonProperty("referenceId")

    private String referenceId = null;

    @JsonProperty("referenceType")

    private String referenceType = null;

    @JsonProperty("hearingDate")

    private Long hearingDate = null;

    @JsonProperty("additionalDetails")

    private Object additionalDetails = null;

    @JsonProperty("auditDetails")

    @Valid
    private AuditDetails auditDetails = null;

    @JsonProperty("date")

    private String date;


}
