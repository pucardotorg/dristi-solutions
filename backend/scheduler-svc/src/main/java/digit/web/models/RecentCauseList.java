package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RecentCauseList {
    @JsonProperty("courtId")
    private String courtId;

    @JsonProperty("fileStoreId")
    private String fileStoreId;

    @JsonProperty("date")
    private LocalDate date = null;

}
