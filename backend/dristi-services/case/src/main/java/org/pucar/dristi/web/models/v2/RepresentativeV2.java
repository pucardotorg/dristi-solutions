package org.pucar.dristi.web.models.v2;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.models.AuditDetails;
import org.pucar.dristi.web.models.Document;
import org.springframework.validation.annotation.Validated;

import java.util.List;

/**
 * AdvocateMapping
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-19T15:42:53.131831400+05:30[Asia/Calcutta]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RepresentativeV2 {

    @JsonProperty("id")
    private String id = null;

    @JsonProperty("advocateId")
    private String advocateId = null;

    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;

    @JsonProperty("representing")
    @Valid
    private List<RepresentingV2> representing = null;
}
