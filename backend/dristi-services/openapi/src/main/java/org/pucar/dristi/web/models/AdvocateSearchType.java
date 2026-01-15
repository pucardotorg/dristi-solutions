package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;

public enum AdvocateSearchType {
    BARCODE("barcode"),
    ADVOCATE_NAME("advocate_name");

    private final String value;

    AdvocateSearchType(String value) {
        this.value = value;
    }

    @JsonCreator
    public static AdvocateSearchType fromValue(String text) {
        return Arrays.stream(values())
                .filter(t -> t.value.equalsIgnoreCase(text))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unexpected value: " + text));
    }

    @JsonValue
    public String toValue() {
        return value;
    }
}
