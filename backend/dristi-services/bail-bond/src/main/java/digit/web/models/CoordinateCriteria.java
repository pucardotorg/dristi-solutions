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
public class CoordinateCriteria {

    @JsonProperty("fileStoreId")
    private String fileStoreId;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("placeholder")
    private String placeholder;
}
