package org.pucar.dristi.web.models;

public enum OrderStatus {

    PENDING_SIGN("pending_sign"),
    SIGNED("signed");

    private final String value;

    OrderStatus(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static OrderStatus fromValue(String value) {
        for (OrderStatus status : OrderStatus.values()) {
            if (status.value.equalsIgnoreCase(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown OrderStatus value: " + value);
    }

    @Override
    public String toString() {
        return value;
    }
}
