package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MiscellaneuosDetails {

    @JsonProperty("issueDate")
    private Long issueDate;

    @JsonProperty("caseFilingDate")
    private Long caseFilingDate;
}
