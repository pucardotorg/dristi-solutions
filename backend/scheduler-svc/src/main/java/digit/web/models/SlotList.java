package digit.web.models;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Builder
@ToString
@Getter
@Setter
public class SlotList {

    @JsonProperty("slotTime")
    private String slotTime = null;

    @JsonProperty("slotName")
    private String slotName = null;

    @JsonProperty("hearingType")
    private String hearingType = null;

    @JsonProperty("CauseList")
    private List<CauseList> causeLists = null;

}
