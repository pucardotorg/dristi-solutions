package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

/**
 * CaseExists
 */
@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CaseExists {

    @JsonProperty("caseId")
    private String caseId = null;

    @JsonProperty("courtCaseNumber")
    private String courtCaseNumber = null;

    @JsonProperty("cnrNumber")
    private String cnrNumber = null;

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("exists")
    private Boolean exists = null;

}
