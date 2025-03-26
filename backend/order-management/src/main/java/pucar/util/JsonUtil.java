package pucar.util;

import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Component
public class JsonUtil {

    public <T> T getNestedValue(Object data, List<String> path, Class<T> type) {
        return Optional.ofNullable(data)
                .filter(Map.class::isInstance)
                .map(obj -> (Map<?, ?>) obj)
                .flatMap(map -> traversePath(map, path))
                .filter(type::isInstance)
                .map(type::cast)
                .orElseThrow(() -> new CustomException("ERROR_IN_ADDITIONAL_DETAILS",
                        "Expected type " + type.getSimpleName() + " not found at path: " + path));
    }

    private Optional<Object> traversePath(Map<?, ?> map, List<String> path) {
        Object current = map;
        for (String key : path) {
            if (!(current instanceof Map<?, ?>)) {
                return Optional.empty();
            }
            current = ((Map<?, ?>) current).get(key);
        }
        return Optional.ofNullable(current);
    }
}

