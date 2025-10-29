package digit.web.models.cases;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PartyAddresses {
    @JsonProperty("addressDetails")
    private AddressDetails addressDetails;

    @JsonProperty("id")
    private String id;
}
