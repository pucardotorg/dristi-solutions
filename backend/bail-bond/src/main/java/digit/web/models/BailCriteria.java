package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.time.OffsetDateTime;
import java.util.List;


@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-07-01T18:25:48.287360981+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BailCriteria {
    @JsonProperty("id")

    private String id = null;

    @JsonProperty("tenantId")
    @NotNull

    private String tenantId = null;

    @JsonProperty("caseId")
    @NotNull

    private String caseId = null;

    @JsonProperty("bailAmount")

    private Double bailAmount = null;

    @JsonProperty("bailType")

    private String bailType = null;

    @JsonProperty("startDate")

    @Valid
    private Long startDate = null;

    @JsonProperty("endDate")

    @Valid
    private Long endDate = null;

    @JsonProperty("isActive")

    private Boolean isActive = null;

    @JsonProperty("accusedId")

    private String accusedId = null;

    @JsonProperty("advocateId")

    private String advocateId = null;

    @JsonProperty("suretyIds")

    private List<String> suretyIds = null;
}
