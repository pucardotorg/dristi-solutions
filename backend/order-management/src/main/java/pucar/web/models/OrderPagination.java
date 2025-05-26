package pucar.web.models;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Sorting order
 */
public enum OrderPagination {
    ASC("asc"), DESC("desc");

    private final String value;

    OrderPagination(String value) {
        this.value = value;
    }

    @JsonCreator
    public static OrderPagination fromValue(String text) {
        for (OrderPagination b : OrderPagination.values()) {
            if (String.valueOf(b.value).equals(text)) {
                return b;
            }
        }
        return null;
    }

    @Override
    @JsonValue
    public String toString() {
        return String.valueOf(value);
    }
}
