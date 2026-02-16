package pucar.web.models.application;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationCriteria {

    @JsonProperty("id")
    private String id = null;

    @JsonProperty("cnrNumber")
    private String cnrNumber = null;

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("applicationType")
    private String applicationType = null;

    @JsonProperty("tenantId")
    @NotNull
    private String tenantId = null;

    @JsonProperty("applicationNumber")
    @Valid
    private String applicationNumber = null;

    @JsonProperty("applicationCMPNumber")
    private String applicationCMPNumber = null;

    @JsonProperty("owner")
    @Valid
    private UUID owner = null;

    @JsonProperty("status")
    @Valid
    private String status = null;

}
