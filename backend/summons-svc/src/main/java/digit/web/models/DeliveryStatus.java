package digit.web.models;

public enum DeliveryStatus {

    NOT_DELIVERED,
    NOT_DELIVERED_ICOPS,

    IN_TRANSIT,

    DELIVERED,
    DELIVERED_ICOPS,

    NOT_UPDATED,

    STATUS_UNKNOWN,
    EXECUTED,

    NOT_EXECUTED,

    // epost intermediate status
    INTERMEDIATE
}
