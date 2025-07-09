package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BailCriteria {
    @JsonProperty("id")
    private String id;
    @JsonProperty("tenantId")
    @NotNull
    private String tenantId;
    @JsonProperty("caseId")
    @NotNull
    private String caseId;
    @JsonProperty("bailAmount")
    private Double bailAmount;
    @JsonProperty("bailType")
    private String bailType;
    @JsonProperty("startDate")
    @Valid
    private Long startDate;
    @JsonProperty("endDate")
    @Valid
    private Long endDate;
    @JsonProperty("isActive")
    private Boolean isActive;
    @JsonProperty("accusedId")
    private String accusedId;
    @JsonProperty("advocateId")
    private String advocateId;

    @JsonProperty("mobileNumber")
    private String mobileNumber;
    @JsonProperty("suretyIds")
    private List<String> suretyIds;

    @JsonProperty("bailId")
    private String bailId;
}
