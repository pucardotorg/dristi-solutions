package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CourtCase {

    @JsonProperty("id")
    private String id;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("filingNumber")
    private String filingNumber;

    @JsonProperty("cnrNumber")
    private String cnrNumber;

    @JsonProperty("cmpNumber")
    private String cmpNumber;

    @JsonProperty("courtCaseNumber")
    private String courtCaseNumber;

    @JsonProperty("caseTitle")
    private String caseTitle;

    @JsonProperty("status")
    private String status;

    @JsonProperty("advocateOffices")
    @Builder.Default
    private List<AdvocateOffice> advocateOffices = new ArrayList<>();
}
