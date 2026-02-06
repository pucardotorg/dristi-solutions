package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Value;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MiscellaneousPdf  {

    @JsonProperty("courtId")
    private String courtId;

    @JsonProperty("processTitle")
    private String processTitle;

    @JsonProperty("processText")
    private String processText;

    @JsonProperty("addresseeName")
    private String addresseeName;

    @JsonProperty("isCoverLetterRequired")
    private Boolean isCoverLetterRequired;

    @JsonProperty("addressee")
    private String addressee;

    @JsonProperty("orderText")
    private String orderText;

    @JsonProperty("coverLetterText")
    private String coverLetterText;

    @JsonProperty("addresseeDetails")
    private String addresseeDetails;

    @JsonProperty("partyDetails")
    private List<PartyDetails> partyDetails;

    @JsonProperty("caseNumber")
    private String caseNumber;

    @JsonProperty("nextHearingDate")
    private Long nextHearingDate;

}