package pucar.web.models.task;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoticeDetails {

    @JsonProperty("issueDate")
    private Long issueDate;

    @JsonProperty("caseFilingDate")
    private Long caseFilingDate;

    @JsonProperty("noticeType")
    private String noticeType;

    @JsonProperty("docSubType")
    private String docSubType;

    @JsonProperty("partyIndex")
    private String partyIndex;
}
