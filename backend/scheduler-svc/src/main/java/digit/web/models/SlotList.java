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

    @JsonProperty("slots")
    private String slots = null;

    @JsonProperty("hearingType")
    private String hearingType = null;

    @JsonProperty("causeLists")
    private List<CauseList> causeLists = null;

}
