package org.pucar.dristi.web.models.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum MemberType {
    ADVOCATE("ADVOCATE"),
    CLERK("CLERK");

    private final String value;

    MemberType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static MemberType fromValue(String value) {
        for (MemberType type : MemberType.values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Invalid MemberType: " + value);
    }

    @Override
    public String toString() {
        return value;
    }
}
