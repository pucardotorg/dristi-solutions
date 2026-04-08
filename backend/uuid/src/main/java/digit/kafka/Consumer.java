package digit.kafka;

import org.springframework.stereotype.Component;

import java.util.HashMap;

@Component
public class Consumer {

    // No listeners needed - egov-persister service handles DB persistence from Kafka topics
    // Topics: save-sample-entity, update-sample-entity
    
    public void listen(final HashMap<String, Object> record) {
        // Placeholder - not used
    }
}
