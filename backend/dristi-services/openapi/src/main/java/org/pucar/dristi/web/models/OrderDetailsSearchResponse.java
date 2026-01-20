package org.pucar.dristi.web.models;

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
import org.pucar.dristi.web.models.cases.PartyDetails;
import org.pucar.dristi.web.models.order.IssuedBy;
import org.pucar.dristi.web.models.order.StatuteSection;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OrderDetailsSearchResponse {
    @JsonProperty("id")
    @Valid
    private UUID id = null;

    @JsonProperty("tenantId")
    @NotNull
    private String tenantId = null;

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("courtId")
    private String courtId = null;

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
    @Size(min = 2, max = 256)
    private String orderNumber = null;

    @JsonProperty("linkedOrderNumber")
    @Size(min = 2, max = 256)
    private String linkedOrderNumber = null;

    @JsonProperty("createdDate")
    @Valid
    private Long createdDate = null;

    @JsonProperty("issuedBy")
    private IssuedBy issuedBy = null;

    @JsonProperty("orderType")
    @Valid
    private String orderType = null;

    @JsonProperty("orderCategory")
    @NotNull
    private String orderCategory = null;

    @JsonProperty("status")
    @NotNull
    private String status = null;

    @JsonProperty("comments")
    private String comments = null;

    @JsonProperty("isActive")
    @NotNull
    private Boolean isActive = null;

    @JsonProperty("statuteSection")
    @Valid
    private StatuteSection statuteSection = null;

    @JsonProperty("documents")
    @Valid
    private List<Document> documents = null;

    @JsonProperty("orderDetails")
    private Object orderDetails = null;

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

    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditDetails = null;

    @JsonProperty("partyDetails")
    private List<PartyDetails> partyDetails = null;

    @JsonProperty("caseTitle")
    private String caseTitle = null;

    @JsonProperty("isPendingTaskCompleted")
    private Boolean isPendingTaskCompleted = false;
}
