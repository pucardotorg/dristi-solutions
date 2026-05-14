package org.pucar.dristi.web.models.witnessdeposition;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Document;
import org.pucar.dristi.web.models.WorkflowObject;
import org.springframework.validation.annotation.Validated;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Artifact
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-05-16T15:17:16.225735+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Artifact {
    @JsonProperty("id")

    @Valid
    private UUID id = null;

    @JsonProperty("tenantId")
    @NotNull

    private String tenantId = null;

    @JsonProperty("artifactNumber")

    @Size(min = 2, max = 64)
    private String artifactNumber = null;

    @JsonProperty("evidenceNumber")

    @Size(min = 2, max = 64)
    private String evidenceNumber = null;
    @JsonProperty("filingNumber")
    @NotNull

    private String filingNumber = null;
    @JsonProperty("externalRefNumber")

    @Size(min = 2, max = 128)
    private String externalRefNumber = null;

    @JsonProperty("courtId")
    private String courtId = null;

    @JsonProperty("caseId")
    @NotNull

    private String caseId = null;

    @JsonProperty("application")

    private String application = null;

    @JsonProperty("hearing")

    private String hearing = null;

    @JsonProperty("order")

    private String order = null;

    @JsonProperty("cnrNumber")

    private String cnrNumber = null;

    @JsonProperty("mediaType")

    private String mediaType = null;

    @JsonProperty("artifactType")

    private String artifactType = null;

    @JsonProperty("sourceType")

    private String sourceType = null;

    @JsonProperty("sourceID")

    private String sourceID = null;

    @JsonProperty("sourceName")

    private String sourceName = null;

    @JsonProperty("applicableTo")

    private List<String> applicableTo = null;

    @JsonProperty("createdDate")

    private Long createdDate = null;

    @JsonProperty("publishedDate")
    private Long publishedDate = null;

    @JsonProperty("isActive")

    private Boolean isActive = true;

    @JsonProperty("isEvidence")

    private Boolean isEvidence = false;

    @JsonProperty("status")

    private String status = null;

    @JsonProperty("filingType")
    private String filingType = null;

    @JsonProperty("isVoid")
    private Boolean isVoid = false;

    @JsonProperty("reason")
    private String reason = null;

    @JsonProperty("file")

    @Valid
    private Document file = null;

    @JsonProperty("seal")
    @Valid
    private Document seal = null;

    @JsonProperty("description")

    private String description = null;

    @JsonProperty("artifactDetails")

    private Object artifactDetails = null;

    @JsonProperty("comments")
    @Valid
    private List<Comment> comments = null;

    @JsonProperty("additionalDetails")

    private Object additionalDetails = null;

    @JsonProperty("auditdetails")

    @Valid
    private AuditDetails auditdetails = null;

    @JsonProperty("workflow")

    @Valid
    private WorkflowObject workflow = null;

    @JsonProperty("shortenedUrl")
    private String shortenedUrl = null;

    @JsonProperty("witnessMobileNumbers")
    private List<String> witnessMobileNumbers = null;

    @JsonProperty("witnessEmails")
    private List<String> witnessEmails = null;

    @JsonProperty("tag")
    private String tag = null;

    @JsonProperty("evidenceMarkedStatus")
    private String evidenceMarkedStatus = null;

    @JsonProperty("isEvidenceMarkedFlow")
    private Boolean isEvidenceMarkedFlow = false;

    @JsonProperty("asUser")
    private String asUser = null;

    public Artifact addApplicableToItem(String applicableToItem) {
        if (this.applicableTo == null) {
            this.applicableTo = new ArrayList<>();
        }
        this.applicableTo.add(applicableToItem);
        return this;
    }

    public Artifact addCommentsItem(Comment commentsItem) {
        if (this.comments == null) {
            this.comments = new ArrayList<>();
        }
        this.comments.add(commentsItem);
        return this;
    }

}
