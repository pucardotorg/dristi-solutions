package pucar.config;

import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class ChannelTypeMap {

    // can be replace with mdms
    private static final Map<String, Object> CHANNEL_TYPE_MAP;

    static {
        CHANNEL_TYPE_MAP = Map.ofEntries(

        );
    }

    public static Map<String, Object> getStateSlaMap() {
        return CHANNEL_TYPE_MAP;
    }

}
