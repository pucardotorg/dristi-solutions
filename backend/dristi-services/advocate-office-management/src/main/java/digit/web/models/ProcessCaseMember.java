package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessCaseMember {

    @JsonProperty("addCaseIds")
    private List<String> addCaseIds = new ArrayList<>();

    @JsonProperty("removeCaseIds")
    private List<String> removeCaseIds = new ArrayList<>();

    @JsonProperty("advocateUserUuid")
    @Valid
    @NotNull
    private UUID advocateUserUuid;

    @JsonProperty("memberUserUuid")
    @Valid
    @NotNull
    private UUID memberUserUuid;

    @JsonProperty("tenantId")
    @Valid
    @NotNull
    private String tenantId;

    @JsonProperty("auditDetails")
    private AuditDetails auditDetails;
}
