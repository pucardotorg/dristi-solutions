package digit.config;

import lombok.Getter;

@Getter
public enum HearingSlotStatus {

    COURT_NON_WORKING("Court Non-Working"),
    SLOTS_FULL("Slots Full"),
    SLOT_AVAILABLE("Slot Available"),
    OPTED_OUT("Opted Out");

    private final String value;

    HearingSlotStatus(String value) {
        this.value = value;
    }
}
