package org.pucar.dristi.web.models.v2;

import lombok.Getter;

@Getter
public enum PartyType {
    ADVOCATE("advocate"),
    COMPLAINANT("complainant"),
    WITNESS("witness"),
    RESPONDENT("respondent");

    private final String value;

    PartyType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static PartyType fromString(String text) {
        for (PartyType type : PartyType.values()) {
            if (type.value.equalsIgnoreCase(text)) {
                return type;
            }
        }
        throw new IllegalArgumentException("No enum constant for value: " + text);
    }
}
