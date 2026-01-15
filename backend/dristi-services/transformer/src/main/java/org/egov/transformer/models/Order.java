package org.egov.transformer.models;

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
import org.egov.common.contract.models.Workflow;
import org.springframework.validation.annotation.Validated;

import java.text.ParseException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * An order is created as an outcome of an hearing or based on an application. Order will contain a set of tasks
 */
//@Schema(description = "An order is created as an outcome of an hearing or based on an application. Order will contain a set of tasks")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-18T11:13:43.389623100+05:30[Asia/Calcutta]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Order {

    @JsonProperty("id")
    @Valid
    private UUID id = null;

    @JsonProperty("tenantId")
    @NotNull
    private String tenantId = null;

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("cnrNumber")
    private String cnrNumber = null;

    @JsonProperty("applicationNumber")
    private List<String> applicationNumber = new ArrayList<>();

    @JsonProperty("hearingNumber")
    @Valid
    private String hearingNumber = null;

    @JsonProperty("hearingType")
    private String hearingType = null;

    @JsonProperty("scheduledHearingNumber")
    @Valid
    private String scheduledHearingNumber = null;

    @JsonProperty("orderNumber")
    private String orderNumber = null;

    @JsonProperty("linkedOrderNumber")
    private String linkedOrderNumber = null;

    @Valid
    private Long createdDate = null;

    @JsonProperty("issuedBy")
    private IssuedBy issuedBy = null;

    @JsonProperty("orderType")
    @Valid
    private String orderType = null;

    @JsonProperty("orderCategory")
    private String orderCategory = null;

    @JsonProperty("status")
    private String status = null;

    @JsonProperty("comments")
    private String comments = null;

    @JsonProperty("isActive")
    private Boolean isActive = null;

    @JsonProperty("statuteSection")
    private StatuteSection statuteSection = null;

    @JsonProperty("documents")
    private List<Document> documents = null;

    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;

    @JsonProperty("auditDetails")
    private AuditDetails auditDetails = null;

    @JsonProperty("workflow")
    private Workflow workflow = null;

    @JsonProperty("orderDetails")
    private Object orderDetails;

    @JsonProperty("taskDetails")
    private Task taskDetails;

    @JsonProperty("compositeItems")
    private Object compositeItems = null;

    @JsonProperty("attendance")
    private Object attendance = null;

    @JsonProperty("itemText")
    private String itemText = null;

    @JsonProperty("purposeOfNextHearing")
    private String purposeOfNextHearing = null;

    @JsonProperty("nextHearingDate")
    private Long nextHearingDate = null;

    @JsonProperty("orderTitle")
    private String orderTitle = null;



    public Order addApplicationIdsItem(String applicationNumbersItem) {
        this.applicationNumber.add(applicationNumbersItem);
        return this;
    }

    public Order addDocumentsItem(Document documentsItem) {
        if (this.documents == null) {
            this.documents = new ArrayList<>();
        }
        this.documents.add(documentsItem);
        return this;
    }
}
