package digit.web.models.taskdetails;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComplainantDetails {


    @JsonProperty("name")
    private String name;

    @JsonProperty("address")
    private Map<String, Object> address;
}
