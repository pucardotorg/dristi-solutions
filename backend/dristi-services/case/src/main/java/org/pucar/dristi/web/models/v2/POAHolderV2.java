package org.pucar.dristi.web.models.v2;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class POAHolderV2 {

    @JsonProperty("individualId")
    private String individualId;

    @JsonProperty("additionalDetails")
    private Object additionalDetails;

    @JsonProperty("representingLitigants")
    private List<PoaPartyV2> representingLitigants;
}
