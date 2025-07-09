package digit.web.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum CaseType {
    ST("ST"),
    CMP("CMP");

    private final String value;

    CaseType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static CaseType fromValue(String value) {
        for (CaseType type : CaseType.values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Invalid case type: " + value);
    }
}
