package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum AdvocateSearchType {
    BARCODE("barcode"),
    ADVOCATE_NAME("advocate_name");

    private final String value;

    AdvocateSearchType(String value) {
        this.value = value;
    }

    @JsonCreator
    public static AdvocateSearchType fromValue(String text) {
        for (AdvocateSearchType b : AdvocateSearchType.values()) {
            if (b.value.equalsIgnoreCase(text)) {
                return b;
            }
        }
        throw new IllegalArgumentException("Unexpected value: " + text);
    }

    @JsonValue
    public String toValue() {
        return value;
    }
}
