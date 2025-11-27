package pucar.web.models.digitalizeddocument;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import pucar.web.models.Document;

import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DigitalizedDocument {

    @JsonProperty("id")
    private String id = null;

    @JsonProperty("type")
    private TypeEnum type = null;

    @JsonProperty("documentNumber")
    private String documentNumber = null;

    @JsonProperty("caseId")
    private String caseId = null;

    @JsonProperty("caseFilingNumber")
    private String caseFilingNumber = null;

    @JsonProperty("orderNumber")
    private String orderNumber = null;

    @JsonProperty("orderItemId")
    private String orderItemId = null;

    @JsonProperty("pleaDetails")
    private Object pleaDetails = null;

    @JsonProperty("examinationOfAccusedDetails")
    private Object examinationOfAccusedDetails = null;

    @JsonProperty("mediationDetails")
    private MediationDetails mediationDetails = null;

    @JsonProperty("additionalDetails")
    private Map<String, Object> additionalDetails = null;

    @JsonProperty("auditDetails")
    private Object auditDetails = null;

    @JsonProperty("workflow")
    private Object workflow = null;

    @JsonProperty("status")
    private String status = null;

    @JsonProperty("documents")
    private List<Document> documents = null;

    @JsonProperty("tenantId")
    private String tenantId = null;
}
