package pucar.web.models.digitalizeddocument;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MediationDetails {

    @JsonProperty("natureOfComplainant")
    private String natureOfComplainant = null;

    @JsonProperty("dateOfInstitution")
    private Long dateOfInstitution = null;

    @JsonProperty("caseStage")
    private String caseStage = null;

    @JsonProperty("hearingDate")
    private Long hearingDate = null;

    @JsonProperty("partyDetails")
    private List<MediationPartyDetails> partyDetails = null;
}
