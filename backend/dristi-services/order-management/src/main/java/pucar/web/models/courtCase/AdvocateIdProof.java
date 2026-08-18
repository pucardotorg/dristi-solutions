package pucar.web.models.courtCase;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AdvocateIdProof {
    @NotNull
    @JsonProperty("name")
    private String name;

    @NotNull
    @JsonProperty("fileName")
    private String fileName;

    @NotNull
    @JsonProperty("fileStore")
    private String fileStore;

    @JsonProperty("documentName")
    private String documentName;
}
