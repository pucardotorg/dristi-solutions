package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DigitalizedDocumentsCriteria {
    @JsonProperty("documentNumber")
    private String documentNumber = null;

    @JsonProperty("fileStoreId")
    private String fileStoreId = null;

    @JsonProperty("placeholder")
    private String placeholder = null;

    @JsonProperty("tenantId")
    private String tenantId = null;
}
