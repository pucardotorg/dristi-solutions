package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;
import org.springframework.validation.annotation.Validated;

@Validated
@Data
@Builder
public class WarrantDetails {

    @JsonProperty("warrantId")
    private String warrantId = null;

    @JsonProperty("issueDate")
    private Long issueDate;

    @JsonProperty("docType")
    private String docType;

    @JsonProperty("docSubType")
    private String docSubType;

    @JsonProperty("partyType")
    private String partyType;

    @JsonProperty("bailableAmount")
    private String bailableAmount;

    @JsonProperty("surety")
    private Integer surety;

    @JsonProperty("executorName")
    private String executorName;

    @JsonProperty("templateType")
    private String templateType;

    @JsonProperty("warrantText")
    private String warrantText;
}
