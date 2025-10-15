package digit.web.models;


import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.springframework.validation.annotation.Validated;

/**
 * FeedBack
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-10-14T19:19:54.104875784+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FeedBack {

    @JsonProperty("rating")
    @Valid
    private Rating rating;

    @JsonProperty("feedback")
    @Valid
    private String feedback;

    @JsonProperty("category")
    @Valid
    private String category;

    @JsonProperty("auditDetails")
    @Valid
    private AuditDetails auditDetails;

}
