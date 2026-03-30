package digit.web.models.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Type of access granted to the member
 */
public enum AccessType {

    ALL_CASES("ALL_CASES"),

    SPECIFIC_CASES("SPECIFIC_CASES");

    private final String value;

    AccessType(String value) {
        this.value = value;
    }

    @Override
    @JsonValue
    public String toString() {
        return String.valueOf(value);
    }

    @JsonCreator
    public static AccessType fromValue(String text) {
        for (AccessType b : AccessType.values()) {
            if (String.valueOf(b.value).equals(text)) {
                return b;
            }
        }
        return null;
    }

}
