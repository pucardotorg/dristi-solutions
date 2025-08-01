package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class JoinCaseDataV2 {

    @JsonProperty("accessCode")
    @NotNull
    private String accessCode = null;

    @JsonProperty("tenantId")
    @NotNull
    private String tenantId = null;

    @JsonProperty("filingNumber")
    @NotNull
    private String filingNumber = null;

    @JsonProperty("representative")
    private JoinCaseRepresentative representative = null;

    @JsonProperty("litigant")
    private List<JoinCaseLitigant> litigant = null;

    @JsonProperty("poa")
    private JoinCasePOA poa = null;

    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;
}
