package pucar.web.models.courtCase;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;
import pucar.web.models.Document;

@Validated
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessInfo {

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("caseId")
    private String caseId;

    @JsonProperty("action")
    private String action;

    @JsonProperty("pendingTaskRefId")
    private String pendingTaskRefId;

}