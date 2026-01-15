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

import java.util.List;

@Schema(description = "CauseList FileStore Details for the Current and yesterday(Before 5:00 P.M.)/tomorrow(After 5:00 P.M.) date.")
@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RecentCauseListResponse {

    @JsonProperty("ResponseInfo")
    @Valid
    private ResponseInfo responseInfo = null;

    @JsonProperty("RecentCauseList")
    @Valid
    private List<RecentCauseList> recentCauseList = null;
}
