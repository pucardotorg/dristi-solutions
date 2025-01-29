package digit.web.models;

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
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-01-15T12:45:29.792404900+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CaseDiaryDocumentItem {

    @JsonProperty("diaryId")

    @Valid
    private UUID diaryId = null;

    @JsonProperty("documentId")
    @Valid
    private String documentId = null;

    @JsonProperty("tenantId")

    private String tenantId = null;

    @JsonProperty("date")

    private Long date = null;

    @JsonProperty("diaryType")

    private String diaryType = null;

    @JsonProperty("fileStoreID")

    private String fileStoreID = null;

    @JsonProperty("documentAuditDetails")
    private AuditDetails documentAuditDetails = null;

}
