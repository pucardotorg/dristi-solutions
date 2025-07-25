package digit.web.models;

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
public class SmsTemplateData {

    private String tenantId;

    private String courtCaseNumber;

    private String cmpNumber;

    private String filingNumber;

    private String shortenedUrl;

}
