package pucar.web.models.mdms;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.util.Map;
import java.util.Set;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MdmsCriteriaV2 {

    @JsonProperty("tenantId")
    @Size(min = 1, max = 100)
    @NotNull
    private String tenantId = null;

    @JsonProperty("ids")
    private Set<String> ids = null;

    @JsonProperty("uniqueIdentifiers")
    @Size(min = 1, max = 64)
    private Set<String> uniqueIdentifiers = null;

    @JsonProperty("schemaCode")
    private String schemaCode = null;

    @JsonProperty("filters")
    private Map<String, String> filterMap = null;

    @JsonProperty("isActive")
    private Boolean isActive = null;

    @JsonIgnore
    private Map<String, String> schemaCodeFilterMap = null;

    @JsonIgnore
    private Set<String> uniqueIdentifiersForRefVerification = null;

    @JsonProperty("offset")
    private Integer offset;

    @JsonProperty("limit")
    private Integer limit;
}
