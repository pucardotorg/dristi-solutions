package pucar.web.models.pendingtask;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.*;

import java.util.List;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class PendingTaskSearchResponse {

    @JsonProperty("data")
    private List<Data> data;

}