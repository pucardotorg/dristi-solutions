package org.pucar.dristi.web.models.bailbond;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.ArrayList;
import java.util.List;

import org.egov.common.contract.models.AuditDetails;
import org.pucar.dristi.web.models.WorkflowObject;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.Builder;

/**
 * Bail
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-07-10T12:09:26.562015481+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Bail {

    @JsonProperty("id")
    private String id = null;

    @JsonProperty("tenantId")
    @NotNull
    private String tenantId = null;

    @JsonProperty("caseId")
    @NotNull
    private String caseId = null;

    @JsonProperty("bailAmount")
    private Double bailAmount = null;

    /**
     * Type of bail (Personal or Surety).
     */
    public enum BailTypeEnum {
        PERSONAL("Personal"),

        SURETY("Surety");

        private String value;

        BailTypeEnum(String value) {
            this.value = value;
        }

        @Override
        @JsonValue
        public String toString() {
            return String.valueOf(value);
        }

        @JsonCreator
        public static BailTypeEnum fromValue(String text) {
            for (BailTypeEnum b : BailTypeEnum.values()) {
                if (String.valueOf(b.value).equals(text)) {
                    return b;
                }
            }
            return null;
        }
    }

    @JsonProperty("bailType")
    private BailTypeEnum bailType = null;

    @JsonProperty("startDate")
    private Long startDate = null;

    @JsonProperty("endDate")
    private Long endDate = null;

    @JsonProperty("isActive")
    private Boolean isActive = null;

    @JsonProperty("litigantId")
    private String litigantId = null;

    @JsonProperty("litigantName")
    private String litigantName = null;

    @JsonProperty("litigantFatherName")
    private String litigantFatherName = null;

    @JsonProperty("litigantSigned")
    private Boolean litigantSigned = null;

    @JsonProperty("litigantMobileNumber")
    @NotNull
    private String litigantMobileNumber = null;

    @JsonProperty("sureties")
    @Valid
    private List<Surety> sureties = null;

    @JsonProperty("shortenedURL")
    private String shortenedURL = null;

    @JsonProperty("status")
    private String status = null;

    @JsonProperty("documents")
    @Valid
    private List<Document> documents = null;

    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;

    @JsonProperty("workflow")
    @Valid
    private WorkflowObject workflow = null;

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditDetails = null;

    @JsonProperty("courtId")
    private String courtId = null;

    @JsonProperty("caseTitle")
    private String caseTitle = null;

    @JsonProperty("cnrNumber")
    private String cnrNumber = null;

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("caseNumber")
    private String caseNumber = null;

    /**
     * Type of the case.
     */
    public enum CaseTypeEnum {
        ST("ST"),

        CMP("CMP");

        private String value;

        CaseTypeEnum(String value) {
            this.value = value;
        }

        @Override
        @JsonValue
        public String toString() {
            return String.valueOf(value);
        }

        @JsonCreator
        public static CaseTypeEnum fromValue(String text) {
            for (CaseTypeEnum b : CaseTypeEnum.values()) {
                if (String.valueOf(b.value).equals(text)) {
                    return b;
                }
            }
            return null;
        }
    }

    @JsonProperty("caseType")
    private CaseTypeEnum caseType = null;

    @JsonProperty("bailId")
    private String bailId = null;


    public Bail addSuretiesItem(Surety suretiesItem) {
        if (this.sureties == null) {
            this.sureties = new ArrayList<>();
        }
        this.sureties.add(suretiesItem);
        return this;
    }

    public Bail addDocumentsItem(Document documentsItem) {
        if (this.documents == null) {
            this.documents = new ArrayList<>();
        }
        this.documents.add(documentsItem);
        return this;
    }

}
