package org.pucar.dristi.web.models.v2;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.pucar.dristi.web.models.Pagination;
import org.springframework.validation.annotation.Validated;

import java.util.List;

/**
 * CaseCriteria
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-15T11:31:40.281899+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CaseSummarySearchCriteria {

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("courtId")
    private String courtId = null;

    @JsonProperty("pagination")
    private Pagination pagination = null;

}
