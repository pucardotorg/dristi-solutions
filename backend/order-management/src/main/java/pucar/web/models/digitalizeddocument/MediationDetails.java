package pucar.web.models.digitalizeddocument;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;

/**
 * Details captured for mediation proceedings.
 */
@Schema(description = "Details captured for mediation proceedings.")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-11-25T18:36:45.881826585+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MediationDetails {

    @JsonProperty("natureOfComplainant")
    private String natureOfComplainant = null;

    @JsonProperty("dateOfInstitution")
    private Long dateOfInstitution = null;

    @JsonProperty("dateOfEndADR")
    private Long dateOfEndADR = null;

    @JsonProperty("caseStage")
    private String caseStage = null;

    @JsonProperty("hearingDate")
    private Long hearingDate = null;

    @JsonProperty("pdfCreatedDate")
    private Long pdfCreatedDate = null;

    @JsonProperty("mediationCentre")
    private String mediationCentre = null;

    @JsonProperty("partyDetails")
    @Valid
    private List<MediationPartyDetails> partyDetails = null;


    public MediationDetails addPartyDetailsItem(MediationPartyDetails partyDetailsItem) {
        if (this.partyDetails == null) {
            this.partyDetails = new ArrayList<>();
        }
        this.partyDetails.add(partyDetailsItem);
        return this;
    }

}
