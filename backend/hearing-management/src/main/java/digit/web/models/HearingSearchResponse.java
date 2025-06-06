package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;

/**
 * This object holds information about the hearingList response
 */
@Schema(description = "This object holds information about the hearingList response")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-18T11:14:11.072458+05:30[Asia/Calcutta]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class HearingSearchResponse {

    @JsonProperty("hearingDate")
    @Valid
    private String hearingDate = null;

    @JsonProperty("dayStatus")
    @Valid
    private String dayStatus = null;

    @JsonProperty("noOfHearing")
    @Valid
    private Integer noOfHearing = null;

    @JsonProperty("hearingList")
    @Valid
    private List<HearingResponse> hearingList = null;

}
