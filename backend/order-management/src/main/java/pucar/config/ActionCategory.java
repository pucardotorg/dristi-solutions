package pucar.config;

public enum ActionCategory {
    SCHEDULE_HEARING("Schedule Hearing"),
    VIEW_APPLICATION("View Application"),
    REVIEW_PROCESS("Review Process"),
    REGISTER_CASES("Register cases");

    private final String displayName;

    ActionCategory(String displayName) {
        this.displayName = displayName;
    }

    @Override
    public String toString() {
        return displayName;
    }
}
