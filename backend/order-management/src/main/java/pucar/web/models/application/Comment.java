package pucar.web.models.application;

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
public class Comment {
    @JsonProperty("id")

    @Valid
    private UUID id = null;

    @JsonProperty("tenantId")
    @NotNull

    private String tenantId = null;

    @JsonProperty("individualId")
    @NotNull

    private String individualId = null;

    @JsonProperty("comment")
    @NotNull

    @Size(min = 2, max = 2048)
    private String comment = null;

    @JsonProperty("isActive")

    private Boolean isActive = true;

    @JsonProperty("additionalDetails")

    private Object additionalDetails = null;

    @JsonProperty("auditdetails")

    @Valid
    private AuditDetails auditdetails = null;

}