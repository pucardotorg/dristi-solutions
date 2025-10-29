package org.egov.eTreasury.model;

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
    private String courtCaseNumber;
    private String cmpNumber;
    private String filingNumber;
    private String tenantId;
}
