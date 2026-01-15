package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

@Schema(description = "This object holds information about the hearingList response")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-18T11:14:11.072458+05:30[Asia/Calcutta]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class HearingResponse {

    @JsonProperty("hearingType")
    @Valid
    private String hearingType = null;

    @JsonProperty("hearingStartTime")
    @Valid
    private Long hearingStartTime = null;

    @JsonProperty("hearingEndTime")
    @Valid
    private Long hearingEndTime = null;

}
