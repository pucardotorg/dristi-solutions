package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import digit.web.models.enums.AccessType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.springframework.validation.annotation.Validated;

import java.util.UUID;

/**
 * UpdateMemberAccess
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2026-01-20T20:30:21.456282080+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdateMemberAccess {

    @JsonProperty("tenantId")
    @NotNull
    private String tenantId = null;

    @JsonProperty("officeAdvocateId")
    @NotNull
    @Valid
    private UUID officeAdvocateId = null;

    @JsonProperty("memberId")
    @NotNull
    @Valid
    private UUID memberId = null;

    @JsonProperty("accessType")
    @NotNull
    private AccessType accessType = null;

    @JsonProperty("allowCaseCreate")
    @NotNull
    private Boolean allowCaseCreate = null;

    @JsonProperty("addNewCasesAutomatically")
    @NotNull
    private Boolean addNewCasesAutomatically = null;

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditDetails = null;
}
