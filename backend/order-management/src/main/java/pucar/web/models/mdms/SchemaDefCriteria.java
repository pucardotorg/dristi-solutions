package pucar.web.models.mdms;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

import java.util.Set;

@Builder
public class SchemaDefCriteria {

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("codes")
    private Set<String> codes;
}
