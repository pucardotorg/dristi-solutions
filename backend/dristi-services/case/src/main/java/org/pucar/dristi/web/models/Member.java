package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.springframework.validation.annotation.Validated;

import java.util.UUID;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Member {

    @JsonProperty("id")
    @Valid
    private UUID id = null;

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("officeAdvocateId")
    @Valid
    private UUID officeAdvocateId = null;

    @JsonProperty("memberType")
    private String memberType = null;

    @JsonProperty("memberId")
    @Valid
    private UUID memberId = null;

    @JsonProperty("memberName")
    private String memberName = null;

    @JsonProperty("memberMobileNumber")
    private String memberMobileNumber = null;

    @JsonProperty("accessType")
    private String accessType = null;

    @JsonProperty("allowCaseCreate")
    private Boolean allowCaseCreate = true;

    @JsonProperty("addNewCasesAutomatically")
    private Boolean addNewCasesAutomatically = true;

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditDetails = null;

    @JsonProperty("isActive")
    private Boolean isActive = true;
}
