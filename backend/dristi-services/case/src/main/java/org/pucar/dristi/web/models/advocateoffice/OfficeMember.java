package org.pucar.dristi.web.models.advocateoffice;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.pucar.dristi.web.models.enums.AccessType;
import org.pucar.dristi.web.models.enums.MemberType;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OfficeMember {

    @JsonProperty("id")
    @Valid
    private UUID id;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("officeAdvocateUserUuid")
    @Valid
    private UUID officeAdvocateUserUuid;

    @JsonProperty("officeAdvocateId")
    @Valid
    private UUID officeAdvocateId;

    @JsonProperty("officeAdvocateName")
    private String officeAdvocateName;

    @JsonProperty("memberType")
    private MemberType memberType;

    @JsonProperty("memberUserUuid")
    @Valid
    private UUID memberUserUuid;

    @JsonProperty("memberId")
    @Valid
    private UUID memberId;

    @JsonProperty("memberName")
    private String memberName;

    @JsonProperty("memberMobileNumber")
    private String memberMobileNumber;

    @JsonProperty("memberEmail")
    private String memberEmail;

    @JsonProperty("accessType")
    private AccessType accessType;

    @JsonProperty("allowCaseCreate")
    private Boolean allowCaseCreate;

    @JsonProperty("addNewCasesAutomatically")
    private Boolean addNewCasesAutomatically;

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditDetails;

    @JsonProperty("isActive")
    private Boolean isActive;
}
