package org.pucar.dristi.web.models.order;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderCriteria {

    @JsonProperty("id")
    private String id = null;

    @JsonProperty("cnrNumber")
    private String cnrNumber = null;

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("applicationNumber")
    private String applicationNumber = null;

    @JsonProperty("orderType")
    private String orderType = null;

    @JsonProperty("courtId")
    private String courtId = null;

    @JsonProperty("orderNumber")
    private String orderNumber = null;

    @JsonProperty("orderCategory")
    private String orderCategory = null;

    @JsonProperty("status")
    private String status = null;

    @JsonProperty("hearingNumber")
    private String hearingNumber = null;

    @JsonProperty("hearingType")
    private String hearingType = null;

    @JsonProperty("scheduledHearingNumber")
    @Valid
    private String scheduledHearingNumber = null;

    @JsonProperty("fromPublishedDate")
    @Valid
    private Long fromPublishedDate = null;

    @JsonProperty("toPublishedDate")
    @Valid
    private Long toPublishedDate = null;

}
