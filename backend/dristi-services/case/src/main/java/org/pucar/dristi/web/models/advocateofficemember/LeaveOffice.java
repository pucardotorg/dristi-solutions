package org.pucar.dristi.web.models.advocateofficemember;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class LeaveOffice {

    @JsonProperty("id")
    private UUID id;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("isActive")
    private Boolean isActive;

    @JsonProperty("officeAdvocateId")
    private UUID officeAdvocateId;

    @JsonProperty("memberId")
    private UUID memberId;

    @JsonProperty("auditDetails")
    private AuditDetails auditDetails;
}
