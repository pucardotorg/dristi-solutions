package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.springframework.validation.annotation.Validated;

import java.util.List;


@Validated
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OpenHearing {

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("caseTitle")
    private String caseTitle = null;

    @JsonProperty("caseUuid")
    private String caseUuid = null;

    @JsonProperty("hearingNumber")
    private String hearingNumber = null;

    @JsonProperty("caseNumber")
    private String caseNumber = null;

    @JsonProperty("hearingUuid")
    private String hearingUuid = null;

    @JsonProperty("stage")
    private String stage = null;

    @JsonProperty("subStage")
    private String subStage = null;

    @JsonProperty("courtId")
    private String courtId = null;

    @JsonProperty("status")
    private String status = null;

    @JsonProperty("fromDate")
    private Long fromDate = null;

    @JsonProperty("toDate")
    private Long toDate = null;

    @JsonProperty("advocate")
    private AdvocateDetails advocate = null;

    @JsonProperty("searchableFields")
    private List<String> searchableFields = null;

    @JsonProperty("hearingType")
    private String hearingType = null;

    @JsonProperty("caseFilingDate")
    private Long caseFilingDate = null;

    @JsonProperty("statusOrder")
    private Integer statusOrder = null;

    @JsonProperty("hearingTypeOrder")
    private Integer hearingTypeOrder = null;

    @JsonProperty("hearingDurationInMillis")
    private Long hearingDurationInMillis = null;

    @JsonProperty("serialNumber")
    private int serialNumber = 0;

    @JsonProperty("orderStatus")
    private OrderStatus orderStatus;
}
