package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

/**
 * DigitalizedDocumentSearchCriteria
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-11-25T18:36:45.881826585+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DigitalizedDocumentSearchCriteria {

    @JsonProperty("id")
    private String id = null;

    @JsonProperty("documentNumber")
    private String documentNumber = null;

    @JsonProperty("type")
    private TypeEnum type = null;

    @JsonProperty("status")
    private String status = null;

    @JsonProperty("tenantId")
    @NotNull
    private String tenantId = null;

    @JsonProperty("courtId")
    private String courtId = null;

    @JsonProperty("orderNumber")
    private String orderNumber = null;

    @JsonProperty("orderItemId")
    private String orderItemId = null;

    @JsonProperty("caseId")
    private String caseId = null;

    @JsonProperty("caseFilingNumber")
    private String caseFilingNumber = null;

}
