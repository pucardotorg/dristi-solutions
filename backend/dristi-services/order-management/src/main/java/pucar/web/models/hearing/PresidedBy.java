package pucar.web.models.hearing;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PresidedBy {

    @JsonProperty("benchID")
    private String benchID = null;

    @JsonProperty("judgeID")
    @NotNull
    @NotEmpty
    private List<String> judgeID = null;

    @JsonProperty("courtID")
    @NotNull
    private String courtID = null;

}
