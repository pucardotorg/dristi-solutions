package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a single party (complainant or accused) rendered in the
 * summons-to-witness party details table.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PartyDetail {

    @JsonProperty("name")
    private String name;

    @JsonProperty("listOfAdvocatesRepresenting")
    private String listOfAdvocatesRepresenting;

}
