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

    @JsonProperty("officeAdvocateId")
    private UUID officeAdvocateId;

    @JsonProperty("officeAdvocateUserUuid")
    private UUID officeAdvocateUserUuid;

    @JsonProperty("memberId")
    private UUID memberId;

    @JsonProperty("memberUserUuid")
    private UUID memberUserUuid;

    @JsonProperty("memberType")
    private String memberType;

    @JsonProperty("isActive")
    private Boolean isActive;

    @JsonProperty("auditDetails")
    private AuditDetails auditDetails;
}
