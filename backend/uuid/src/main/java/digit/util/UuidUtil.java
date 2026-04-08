package digit.util;

import com.fasterxml.uuid.Generators;
import com.fasterxml.uuid.impl.TimeBasedEpochGenerator;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class UuidUtil {

    private final TimeBasedEpochGenerator uuidV7Generator;

    public UuidUtil() {
        this.uuidV7Generator = Generators.timeBasedEpochGenerator();
    }

    public UUID generateUuidV7AsUUID() {
        return uuidV7Generator.generate();
    }

    public long extractTimestampFromUuidV7(String uuidString) {
        UUID uuid = UUID.fromString(uuidString);
        return extractTimestampFromUuidV7(uuid);
    }

    public long extractTimestampFromUuidV7(UUID uuid) {
        long mostSigBits = uuid.getMostSignificantBits();
        return (mostSigBits >>> 16) & 0xFFFFFFFFFFFFL;
    }

    public boolean isValidUuidV7(String uuidString) {
        try {
            UUID uuid = UUID.fromString(uuidString);
            return isValidUuidV7(uuid);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    public boolean isValidUuidV7(UUID uuid) {
        if (uuid == null) return false;
        return uuid.version() == 7;
    }
}
