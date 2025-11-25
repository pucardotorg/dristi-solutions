package digit.web.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonValue;
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
    /**
     * Gets or Sets partyType
     */
    public enum PartyTypeEnum {
        COMPLAINANT("COMPLAINANT"),

        RESPONDENT("RESPONDENT");

        private String value;

        PartyTypeEnum(String value) {
            this.value = value;
        }

        @Override
        @JsonValue
        public String toString() {
            return String.valueOf(value);
        }

        @JsonCreator
        public static PartyTypeEnum fromValue(String text) {
            for (PartyTypeEnum b : PartyTypeEnum.values()) {
                if (String.valueOf(b.value).equals(text)) {
                    return b;
                }
            }
            return null;
        }
    }

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
