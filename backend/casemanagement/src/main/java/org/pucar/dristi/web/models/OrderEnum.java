package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Sorting order
 */
public enum OrderEnum {
    ASC("asc"), DESC("desc");

    private String value;

    OrderEnum(String value) {
        this.value = value;
    }

    @Override
    @JsonValue
    public String toString() {
        return String.valueOf(value);
    }

    @JsonCreator
    public static OrderEnum fromValue(String text) {
        for (OrderEnum b : OrderEnum.values()) {
            if (String.valueOf(b.value).equals(text)) {
                return b;
            }
        }
        return null;
    }
}
