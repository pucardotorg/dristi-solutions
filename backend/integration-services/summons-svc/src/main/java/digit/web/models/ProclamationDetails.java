package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

@Validated
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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

    @JsonProperty("partyType")
    private String partyType;

}
