package pucar.config;

import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class ChannelTypeMap {

    // can be replace with mdms
    private static final Map<String, Map<String, String>> CHANNEL_TYPE_MAP;

    static {
        CHANNEL_TYPE_MAP = Map.ofEntries(
                Map.entry("e-Post", Map.of("code", "POST", "type", "Post")),
                Map.entry("Registered Post", Map.of("code", "RPAD", "type", "RPAD")),
                Map.entry("SMS", Map.of("code", "SMS", "type", "SMS")),
                Map.entry("Via Police", Map.of("code", "POLICE", "type", "Police")),
                Map.entry("E-mail", Map.of("code", "EMAIL", "type", "Email"))
        );
    }

    public static Map<String, Map<String, String>> getStateSlaMap() {
        return CHANNEL_TYPE_MAP;
    }

}
