package digit.web.models.cases;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaseCriteria {

    @JsonProperty("caseId")
    private String caseId;

    @JsonProperty("filingNumber")
    private String filingNumber;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("status")
    @Valid
    private List<String> status = null;


    @JsonProperty("outcome")
    @Valid
    private List<String> outcome = null;

}
