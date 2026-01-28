package org.drishti.esign.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;

import java.util.List;
import java.util.Map;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ESignParameter {

    @JsonProperty("id")
    private String id;

    @JsonProperty("consent")
    private String consent;  // user consent

    @JsonProperty("authType")
    private String authType;  // otp=1, fingerprint=2, iris=3

    @JsonProperty("fileStoreId")
    private String fileStoreId;

    @JsonProperty("signedFileStoreId")
    private String signedFileStoreId;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("pageModule")
    private String pageModule;

    @JsonProperty("signPlaceHolder")
    private String signPlaceHolder;

    @JsonProperty("filePath")
    private String filePath;

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditDetails ;

    // Multi-page signing fields
    @JsonProperty("multiPageSigning")
    private Boolean multiPageSigning;

    @JsonProperty("specificPages")
    private List<Integer> specificPages;

    @JsonProperty("applyToAllPages")
    private Boolean applyToAllPages;

    @JsonProperty("placeholders")
    private Map<Integer, String> placeholders;

}
