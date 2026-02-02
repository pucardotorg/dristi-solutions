package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class Others {

    @JsonProperty("uniqueid")
    private String uniqueid;

    @JsonProperty("name")
    private String name;
}
