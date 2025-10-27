package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.UUID;

import org.egov.common.contract.models.AuditDetails;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.Builder;

/**
 * TaskComment
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-10-27T11:32:01.103620686+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TaskComment {
    @JsonProperty("id")

    @Valid
    private UUID id = null;

    @JsonProperty("taskId")

    @Valid
    private UUID taskId = null;

    @JsonProperty("comment")

    private String comment = null;

    @JsonProperty("createdBy")

    @Valid
    private UUID createdBy = null;

    @JsonProperty("createdDate")

    private Long createdDate = null;

    @JsonProperty("isInternal")

    private Boolean isInternal = null;

    @JsonProperty("auditDetails")

    @Valid
    private AuditDetails auditDetails = null;


}
