package pucar.web.models.courtCase;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum MemberType {

    ADVOCATE("ADVOCATE"),

    ADVOCATE_CLERK("ADVOCATE_CLERK");

    private final String value;

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
            if (String.valueOf(b.value).equals(text)) {
                return b;
            }
        }
        return null;
    }
}
