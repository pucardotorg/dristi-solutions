package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.pucar.dristi.web.models.enums.MemberType;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdvocateOfficeMember {

    @JsonProperty("id")
    private String id;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("caseId")
    private String caseId;

    @JsonProperty("memberId")
    private String memberId;

    @JsonProperty("memberUserUuid")
    private String memberUserUuid = null;

    @JsonProperty("memberName")
    private String memberName;

    @JsonProperty("memberType")
    private MemberType memberType;

    @JsonProperty("isActive")
    private Boolean isActive;

    @JsonProperty("auditDetails")
    private AuditDetails auditDetails;
}
