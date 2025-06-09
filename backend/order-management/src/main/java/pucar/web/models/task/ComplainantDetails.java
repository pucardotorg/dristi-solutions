package pucar.web.models.task;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import pucar.web.models.Address;

import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ComplainantDetails {

    @JsonProperty("name")
    private String name;

    @JsonProperty("address")
    private Map<String, Object> address;
}
