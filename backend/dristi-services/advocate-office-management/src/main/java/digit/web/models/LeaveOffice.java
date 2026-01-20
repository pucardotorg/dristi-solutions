package digit.web.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonValue;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.util.UUID;

/**
 * LeaveOffice
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2026-01-20T20:30:21.456282080+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LeaveOffice {
    @JsonProperty("id")

    @Valid
    private UUID id = null;

    @JsonProperty("officeAdvocateId")
    @NotNull

    @Valid
    private UUID officeAdvocateId = null;

    /**
     * Type of member leaving the office
     */
    public enum MemberTypeEnum {
        ADVOCATE("ADVOCATE"),

        ADVOCATE_CLERK("ADVOCATE_CLERK");

        private String value;

        MemberTypeEnum(String value) {
            this.value = value;
        }

        @Override
        @JsonValue
        public String toString() {
            return String.valueOf(value);
        }

        @JsonCreator
        public static MemberTypeEnum fromValue(String text) {
            for (MemberTypeEnum b : MemberTypeEnum.values()) {
                if (String.valueOf(b.value).equals(text)) {
                    return b;
                }
            }
            return null;
        }
    }

    @JsonProperty("memberType")
    @NotNull

    private MemberTypeEnum memberType = null;

    @JsonProperty("memberId")
    @NotNull

    @Valid
    private UUID memberId = null;


}
