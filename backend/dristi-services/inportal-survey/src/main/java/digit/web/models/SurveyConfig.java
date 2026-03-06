package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SurveyConfig {

    @JsonProperty("id")
    private  Integer id;

    @JsonProperty("noOfDaysForRemindMeLater")
    private Long noOfDaysForRemindMeLater;

    @JsonProperty("maxNoOfAttempts")
    private Integer maxNoOfAttempts;

    @JsonProperty("noOfDaysForExpiryAfterFeedBack")
    private Long noOfDaysForExpiryAfterFeedBack;
}
