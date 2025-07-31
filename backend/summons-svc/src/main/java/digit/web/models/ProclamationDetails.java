package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;
import org.springframework.validation.annotation.Validated;

@Validated
@Data
@Builder
public class ProclamationDetails {

    @JsonProperty("proclamationId")
    private String proclamationId = null;

    @JsonProperty("issueDate")
    private Long issueDate;

    @JsonProperty("docSubType")
    private String docSubType;

    @JsonProperty("templateType")
    private String templateType;

    @JsonProperty("proclamationText")
    private String proclamationText;
}
