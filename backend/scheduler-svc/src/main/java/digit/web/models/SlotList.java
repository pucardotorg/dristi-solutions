package digit.web.models;


import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
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
public class SlotList {

    @JsonProperty("slotName")
    private String slotName;

    @JsonProperty("slotStartTime")
    private String slotStartTime;

    @JsonProperty("slotEndTime")
    private String slotEndTime;

    @JsonProperty("hearingType")
    private String hearingType;

    @JsonProperty("CauseList")
    private List<CauseList> causeLists;
}
