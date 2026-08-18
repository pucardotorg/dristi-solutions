package digit.web.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonValue;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;

@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-07-10T12:09:26.562015481+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BailSearchCriteria {

    @JsonProperty("userUuid")
    private String userUuid;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("id")
    private String id;

    @JsonProperty("litigantIndividualId")
    private String litigantIndividualId;

    @JsonProperty("bailId")
    private String bailId;

    @JsonProperty("courtId")
    private String courtId;

    @JsonProperty("filingNumber")
    private String filingNumber;

    @JsonProperty("cnrNumber")
    private String cnrNumber;

    @JsonProperty("suretyMobileNumber")
    private String suretyMobileNumber;

    // TODO : remove this, this is temporary fix (#5016)
    @JsonProperty("owner")
    private String owner;

    @JsonProperty("status")
    private List<String> status;

    public enum BailTypeEnum {
        PERSONAL("Personal"),

        SURETY("Surety");

        private String value;

        BailTypeEnum(String value) {
            this.value = value;
        }

        @Override
        @JsonValue
        public String toString() {
            return String.valueOf(value);
        }

        @JsonCreator
        public static BailTypeEnum fromValue(String text) {
            for (BailTypeEnum b : BailTypeEnum.values()) {
                if (String.valueOf(b.value).equalsIgnoreCase(text)) {
                    return b;
                }
            }
            return null;
        }
    }

    @JsonProperty("bailType")
    private BailTypeEnum bailType = null;

    /**
     * Type of the case.
     */
    public enum CaseTypeEnum {
        ST("ST"),

        CMP("CMP");

        private String value;

        CaseTypeEnum(String value) {
            this.value = value;
        }

        @Override
        @JsonValue
        public String toString() {
            return String.valueOf(value);
        }

        @JsonCreator
        public static CaseTypeEnum fromValue(String text) {
            for (CaseTypeEnum b : CaseTypeEnum.values()) {
                if (String.valueOf(b.value).equalsIgnoreCase(text)) {
                    return b;
                }
            }
            return null;
        }
    }

    @JsonProperty("caseType")
    private CaseTypeEnum caseType;

    @JsonProperty("caseNumber")
    private String caseNumber;

    @JsonProperty("fuzzySearch")
    private Boolean fuzzySearch=false;

    @JsonProperty
    private String asUser = null;

}
