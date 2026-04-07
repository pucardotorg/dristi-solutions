package org.pucar.dristi.web.models.courtcase;

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
public class AdvocateOfficeMember {

    @JsonProperty("id")
    private String id = null;

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("caseId")
    private String caseId = null;

    @JsonProperty("memberId")
    private String memberId = null;

    @JsonProperty("memberUserUuid")
    private String memberUserUuid = null;

    @JsonProperty("memberName")
    private String memberName = null;

    @JsonProperty("memberType")
    private MemberType memberType = null;

    @JsonProperty("isActive")
    private Boolean isActive = null;

    @JsonProperty("auditDetails")
    private AuditDetails auditDetails;
}
