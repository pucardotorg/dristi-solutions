package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;


@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BailsCriteria {
    @JsonProperty("fileStoreId")
    private String fileStoreId = null;

    @JsonProperty("bailId")
    private String bailId = null;

    @JsonProperty("placeholder")
    private String placeholder = null;

    @JsonProperty("tenantId")
    private String tenantId = null;
}
