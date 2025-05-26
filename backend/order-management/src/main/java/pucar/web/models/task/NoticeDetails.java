package pucar.web.models.task;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NoticeDetails {

    @JsonProperty("issueDate")
    private Long issueDate;

    @JsonProperty("docType")
    private String docType;

    @JsonProperty("docSubType")
    private String docSubType;

    @JsonProperty("partyType")
    private String partyType;

    @JsonProperty("caseFilingDate")
    private Long caseFilingDate;

    @JsonProperty("partyIndex")
    private String partyIndex;

    @JsonProperty("noticeType")
    private String noticeType;


}
