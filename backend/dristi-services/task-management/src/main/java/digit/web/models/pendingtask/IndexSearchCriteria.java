package digit.web.models.pendingtask;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.Max;
import javax.validation.constraints.NotNull;
import java.util.HashMap;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class IndexSearchCriteria {
    @NotNull
    @JsonProperty("tenantId")
    private String tenantId;

    @NotNull
    @JsonProperty("moduleName")
    private String moduleName;

    @JsonProperty("moduleSearchCriteria")
    private HashMap<String, Object> moduleSearchCriteria;

    @JsonProperty("offset")
    private Integer offset;

    @JsonProperty("limit")
    @Max(value = 300)
    private Integer limit;
}
