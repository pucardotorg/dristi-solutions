package pucar.web.models.digitalizeddocument;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MediationPartyDetails {

    @JsonProperty("partyType")
    private PartyTypeEnum partyType = null;

    @JsonProperty("uniqueId")
    private String uniqueId = null;

    @JsonProperty("mobileNumber")
    private String mobileNumber = null;

    @JsonProperty("partyName")
    private String partyName = null;

    @JsonProperty("partyIndex")
    private Integer partyIndex = null;

    @JsonProperty("hasSigned")
    private Boolean hasSigned = null;
}
