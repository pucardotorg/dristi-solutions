package pucar.web.models.courtCase;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import pucar.web.models.Document;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PoaParty {

    @JsonProperty("id")
    private String id;

    @JsonProperty("individualId")
    @NotNull
    private String individualId;

    @JsonProperty("caseId")
    private String caseId;

    @JsonProperty("documents")
    private List<Document> documents = new ArrayList<>();

    @JsonProperty("isActive")
    private Boolean isActive = true;
}
