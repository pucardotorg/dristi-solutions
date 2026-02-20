package org.pucar.dristi.web.models.lock;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.pucar.dristi.web.models.AuditDetails;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity(name = "lock")
public class Lock {

    @JsonProperty("id")
    @Valid
    @Id
    private String id = null;

    @JsonProperty("tenantId")
    @NotNull(message = "tenantId cannot be null")
    private String tenantId = null;

    @JsonProperty("uniqueId")
    @NotNull(message = "uniqueId cannot be null")
    private String uniqueId = null;

    @JsonProperty("lockDate")
    @Valid
    private Long lockDate = null;

    @JsonProperty("individualId")
    private String individualId = null;

    @JsonProperty("isLocked")
    @NotNull
    private Boolean isLocked = false;

    @JsonProperty("lockReleaseTime")
    private Long lockReleaseTime = null;

    @JsonProperty("entity")
    private String entity = null;

    @JsonProperty("userId")
    private String userId = null;

    @JsonProperty("lockType")
    @NotNull(message = "lock type cannot be null")
    private String lockType = null;

    @JsonProperty("auditDetails")
    @Valid
    @Embedded
    private AuditDetails auditDetails = null;


}
