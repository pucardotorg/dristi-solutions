package pucar.web.models.pendingtask;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Builder
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Inbox {

    @JsonProperty("businessObject")
    private Map<String,Object> businessObject;

    @JsonProperty("serviceObject")
    private Map<String,Object>	serviceObject;
}