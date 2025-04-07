package pucar.web.models.pendingtask;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Data {

    @JsonProperty("fields")
    private List<Field> fields;

}
