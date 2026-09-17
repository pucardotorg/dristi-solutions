package digit.web.models.taskdetails;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;
import org.springframework.validation.annotation.Validated;


/**
 * Summon
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-05-29T13:38:04.562296+05:30[Asia/Calcutta]")
@Data
@Builder
public class SummonsDetails {

    @JsonProperty("summonId")
    private String summonId = null;

    @JsonProperty("issueDate")
    private Long issueDate;//lastmodifiedtime(from audit details) or createddate(published date) of order details

    @JsonProperty("docType")
    private String docType;

    @JsonProperty("docSubType")
    private String docSubType;

    @JsonProperty("partyType")
    private String partyType;

    @JsonProperty("caseFilingDate")
    private Long caseFilingDate;
}
