package pucar.web.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SMSTemplateData {
    private String orderType;
    private String partyType;
    private String days;
    private String cmpNumber;
    private String courtCaseNumber;
    private String tenantId;
    private String submissionDueDate;
    private String shortenedUrl;
}
