package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SampleEntity {

    @JsonProperty("id")
    private UUID id;

    @JsonProperty("testUuid")
    private UUID testUuid;
}
