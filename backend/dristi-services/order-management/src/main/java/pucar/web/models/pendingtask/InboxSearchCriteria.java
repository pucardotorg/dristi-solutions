package pucar.web.models.pendingtask;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.Valid;
import javax.validation.constraints.Max;
import javax.validation.constraints.NotNull;
import java.util.HashMap;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class InboxSearchCriteria {


    @NotNull
    @JsonProperty("tenantId")
    private String tenantId;

    @Valid
    @JsonProperty("processSearchCriteria")
    private ProcessInstanceSearchCriteria processSearchCriteria;

    @JsonProperty("moduleSearchCriteria")
    private HashMap<String,Object> moduleSearchCriteria;

    @JsonProperty("offset")
    private Integer offset;

    @JsonProperty("limit")
    @Max(value = 300)
    private Integer limit;
}
