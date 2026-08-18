package digit.web.models.pendingtask;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import lombok.Data;

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