package digit.web.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum BailType {
    PERSONAL("Personal"),
    SURETY("Surety");

    private final String value;

    BailType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static BailType fromValue(String value) {
        for (BailType type : BailType.values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Invalid bail type: " + value);
    }
}

