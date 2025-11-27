package pucar.web.models.digitalizeddocument;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private String tenantId = null;

    @JsonProperty("orderNumber")
    private String orderNumber = null;

    @JsonProperty("orderItemId")
    private String orderItemId = null;
}
