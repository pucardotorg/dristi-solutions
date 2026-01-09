package org.pucar.dristi.web.models.order;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.pucar.dristi.web.models.Document;
import org.pucar.dristi.web.models.StatuteSection;
import org.pucar.dristi.web.models.WorkflowObject;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

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
    @Size(min = 2, max = 256)
    private String orderNumber = null;

    @JsonProperty("linkedOrderNumber")
    @Size(min = 2, max = 256)
    private String linkedOrderNumber = null;

    @JsonProperty("createdDate")
    @Valid
    private Long createdDate = null;

    @JsonProperty("issuedBy")
    private Object issuedBy = null;

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

    @JsonProperty("orderTitle")
    private String orderTitle = null;

    @JsonProperty("hearingSummary")
    private String hearingSummary = null;

    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditDetails = null;

    @JsonProperty("workflow")
    @Valid
    private WorkflowObject workflow = null;

    @JsonProperty("nextHearingDate")
    private Long nextHearingDate = null;

}
