package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum MemberType {

    ADVOCATE("ADVOCATE"),
    ADVOCATE_CLERK("ADVOCATE_CLERK");

    private String value;

    MemberType(String value) {
        this.value = value;
    }

    @Override
    @JsonValue
    public String toString() {
        return String.valueOf(value);
    }

    @JsonCreator
    public static MemberType fromValue(String text) {
        for (MemberType b : MemberType.values()) {
            if (String.valueOf(b.value).equalsIgnoreCase(text)) {
                return b;
            }
        }
        return null;
    }
}
