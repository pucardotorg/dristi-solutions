package org.egov.transformer.models;

public enum OrderStatus {

    PENDING_SIGN("PENDING_SIGN"),
    SIGNED("SIGNED"),
    DRAFT("DRAFT"),
    NOT_CREATED("NOT_CREATED");

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
