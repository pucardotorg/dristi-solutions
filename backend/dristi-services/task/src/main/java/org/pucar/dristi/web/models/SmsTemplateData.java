package org.pucar.dristi.web.models;

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

    private String partyType;

    private String processType;

    private String caseNumber;

    private String hearingDate;

    private String cmpNumber;

    private String accusedName;
}
