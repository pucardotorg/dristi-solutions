package org.egov.transformer.models;

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

    @Override
    public String toString() {
        return value;
    }
}
