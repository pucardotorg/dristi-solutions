package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class HearingListPriority {

    @JsonProperty("slotName")
    private String slotName;

    @JsonProperty("slotStartTime")
    private String slotStartTime;

    @JsonProperty("slotEndTime")
    private String slotEndTime;

    @JsonProperty("SlotList")
    private List<SlotList> slotList = null;
}
