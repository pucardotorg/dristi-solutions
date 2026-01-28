package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AdvocateOffice {

    @JsonProperty("id")
    private UUID id;

    @JsonProperty("officeAdvocateId")
    private String officeAdvocateId = null;

    @JsonProperty("officeAdvocateName")
    private String officeAdvocateName = null;

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("caseId")
    private String caseId = null;

    @JsonProperty("members")
    @Valid
    @Builder.Default
    private List<AdvocateOfficeMember> members = new ArrayList<>();

    @JsonProperty("auditDetails")
    private AuditDetails auditDetails;

}
