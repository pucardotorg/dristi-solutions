package pucar.web.models.hearing;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Document;
import pucar.web.models.WorkflowObject;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Hearing {
    @JsonProperty("id")

    @Valid
    private UUID id = null;

    @JsonProperty("tenantId")
    @NotNull

    private String tenantId = null;

    @JsonProperty("hearingId")
    @Size(min = 2, max = 64)
    @Valid
    private String hearingId = null;

    @JsonProperty("courtCaseNumber")
    private String courtCaseNumber = null;

    @JsonProperty("caseReferenceNumber")
    private String caseReferenceNumber = null;

    @JsonProperty("cmpNumber")
    private String cmpNumber = null;

    @JsonProperty("filingNumber")

    private List<String> filingNumber = new ArrayList<>();

    @JsonProperty("cnrNumbers")

    private List<String> cnrNumbers = new ArrayList<>();

    @JsonProperty("applicationNumbers")

    private List<String> applicationNumbers = new ArrayList<>();

    @JsonProperty("hearingType")
    @NotNull

    private String hearingType = null;

    @JsonProperty("status")
    @NotNull
// Hearing workflow state,
    private String status = null;

    @JsonProperty("startTime")

    @Valid
    private Long startTime = null;

    @JsonProperty("endTime")

    @Valid
    private Long endTime = null;

    @JsonProperty("presidedBy")
    @Valid
    private PresidedBy presidedBy = null;

    @JsonProperty("attendees")

    private List<Attendee> attendees = new ArrayList<>();

    @JsonProperty("transcript")

    private List<String> transcript = new ArrayList<>();

    @JsonProperty("vcLink")

    private String vcLink = null;

    @JsonProperty("isActive")

    private Boolean isActive = null;

    @JsonProperty("documents")
    @Valid
    private List<Document> documents = new ArrayList<>();

    @JsonProperty("additionalDetails")

    private Object additionalDetails = null;

    @JsonProperty("auditDetails")

    @Valid
    private AuditDetails auditDetails = null;

    @JsonProperty("workflow")

    @Valid
    private WorkflowObject workflow = null;

    @JsonProperty("notes")

    private String notes = null;

    @JsonProperty("hearingSummary")
    @Valid
    private String hearingSummary = null;


    public Hearing addFilingNumberItem(String filingNumberItem) {
        this.filingNumber.add(filingNumberItem);
        return this;
    }

    public Hearing addCnrNumbersItem(String cnrNumbersItem) {
        this.cnrNumbers.add(cnrNumbersItem);
        return this;
    }

    public Hearing addApplicationNumbersItem(String applicationNumbersItem) {
        this.applicationNumbers.add(applicationNumbersItem);
        return this;
    }

    public Hearing addAttendeesItem(Attendee attendeesItem) {
        if (this.attendees == null) {
            this.attendees = new ArrayList<>();
        }
        this.attendees.add(attendeesItem);
        return this;
    }

    public Hearing addTranscriptItem(String transcriptItem) {
        this.transcript.add(transcriptItem);
        return this;
    }

    public Hearing addDocumentsItem(Document documentsItem) {
        this.documents.add(documentsItem);
        return this;
    }

}