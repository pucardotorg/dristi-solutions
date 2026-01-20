package pucar.web.models.digitalizeddocument;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

/**
 * MediationPartyDetails
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-11-25T18:36:45.881826585+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MediationPartyDetails {

    @JsonProperty("partyType")

    private PartyTypeEnum partyType = null;

    @JsonProperty("uniqueId")

    private String uniqueId = null;

    @JsonProperty("userUuid")

    private String userUuid = null;

    @JsonProperty("poaUuid")

    private String poaUuid = null;

    @JsonProperty("mobileNumber")

    private String mobileNumber = null;

    @JsonProperty("partyName")

    private String partyName = null;

    @JsonProperty("partyIndex")

    private Integer partyIndex = null;

    @JsonProperty("hasSigned")

    private Boolean hasSigned = null;

    @JsonProperty("counselName")

    private String counselName = null;


}
