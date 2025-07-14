package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

@Data
public class SuretySearchCriteria {

    @JsonProperty("ids")
    private List<String> ids = null;

    @JsonProperty("tenantId")
    private String tenantId = null;
}
