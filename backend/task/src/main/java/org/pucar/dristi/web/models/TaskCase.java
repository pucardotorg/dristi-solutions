package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.models.Workflow;
import org.springframework.validation.annotation.Validated;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * A task case is dto
 */
@Schema(description = "A task is created as part of an Order. It will always be linked to an order")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-18T11:14:50.003326400+05:30[Asia/Calcutta]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TaskCase {


    @JsonProperty("id")
    @Valid
    private UUID id = null;

    @JsonProperty("tenantId")
    @NotNull
    private String tenantId = null;

    @JsonProperty("caseName")
    private String caseName = null;

    @JsonProperty("orderType")
    private String orderType = null;

    @JsonProperty("orderId")
    @NotNull
    @Valid
    private UUID orderId = null;

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("taskNumber")
    private String taskNumber = null;

    @JsonProperty("cnrNumber")
    private String cnrNumber = null;

    @JsonProperty("cmpNumber")
    private String cmpNumber = null;

    @JsonProperty("courtCaseNumber")
    private String courtCaseNumber = null;

    @JsonProperty("courtId")
    private String courtId = null;

    @JsonProperty("createdDate")
    @NotNull
    @Valid
    @JsonFormat(pattern = "dd-MM-yyyy")
    private Long createdDate = null;

    @JsonProperty("dateCloseBy")
    @Valid
    @JsonFormat(pattern = "dd-MM-yyyy")
    private Long dateCloseBy = null;

    @JsonProperty("dateClosed")
    @Valid
    @JsonFormat(pattern = "dd-MM-yyyy")
    private Long dateClosed = null;

    @JsonProperty("taskDescription")
    private String taskDescription = null;

    @JsonProperty("taskType")
    @NotNull
    private String taskType = null;

    @JsonProperty("taskDetails")
    private Object taskDetails = null;

    @JsonProperty("amount")
    @Valid
    private Amount amount = null;

    @JsonProperty("status")
    @NotNull
    private String status = null;

    @JsonProperty("documentStatus")
    private String documentStatus;

    @JsonProperty("assignedTo")
    private AssignedTo assignedTo = null;

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
    private Workflow workflow = null;


    public org.pucar.dristi.web.models.TaskCase addDocumentsItem(Document documentsItem) {
        this.documents.add(documentsItem);
        return this;
    }

}
