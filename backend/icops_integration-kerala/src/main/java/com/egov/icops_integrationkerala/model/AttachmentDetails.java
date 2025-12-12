package com.egov.icops_integrationkerala.model;

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
public class AttachmentDetails {

    @JsonProperty("attachmentId")
    private String attachmentId = null;

    @JsonProperty("issueDate")
    private Long issueDate;

    @JsonProperty("docSubType")
    private String docSubType;

    @JsonProperty("templateType")
    private String templateType;

    @JsonProperty("attachmentText")
    private String attachmentText;

    @JsonProperty("chargeDays")
    private String chargeDays;

    @JsonProperty("village")
    private String village;

    @JsonProperty("district")
    private String district;

    @JsonProperty("partyType")
    private String partyType;

}
