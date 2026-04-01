package pucar.web.models.task;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class AssignedTo {

    @JsonProperty("individualId")
    private UUID individualId = null;

    @JsonProperty("name")
    private String name = null;

    @JsonProperty("uuid")
    private UUID uuid = null;

}
