package pucar.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;


@Data
public class HearingDraftOrder {

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("cnrNumber")
    private String cnrNumber = null;

    @JsonProperty("hearingNumber")
    private String hearingNumber = null;

    @JsonProperty("hearingType")
    private String hearingType = null;
}
