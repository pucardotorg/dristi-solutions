package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.*;
import org.egov.common.contract.response.ResponseInfo;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkDiaryEntryResponse {

    @JsonProperty("ResponseInfo")
    @Valid
    private ResponseInfo responseInfo;

    @JsonProperty("diaryEntries")
    @Valid
    private List<CaseDiaryEntry> caseDiaryEntries;

}
