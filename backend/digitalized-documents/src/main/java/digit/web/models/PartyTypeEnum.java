package digit.web.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Party Type Enum
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
