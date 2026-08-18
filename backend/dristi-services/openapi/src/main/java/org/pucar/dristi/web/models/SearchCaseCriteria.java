package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;



@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SearchCaseCriteria {


    @JsonProperty("searchType")                 // Enum: FILING_NUMBER, CASE_NUMBER, CNR_NUMBER, ADVOCATE, LITIGANT, ALL
    @Valid
    private SearchType searchType = null;

    @JsonProperty("filingNumberCriteria")       // for FILING_NUMBER
    @Valid
    private FilingNumberCriteria filingNumberCriteria = null;

    @JsonProperty("caseNumberCriteria")         // for CASE_NUMBER
    @Valid
    private CaseNumberCriteria caseNumberCriteria = null;

    @JsonProperty("cnrNumberCriteria")          // for CNR_NUMBER
    @Valid
    private CnrNumberCriteria cnrNumberCriteria = null;

    @JsonProperty("advocateCriteria")          // for ADVOCATE
    @Valid
    private AdvocateCriteria advocateCriteria = null;

    @JsonProperty("litigantCriteria")         // for LITIGANT
    @Valid
    private LitigantCriteria litigantCriteria = null;

}
