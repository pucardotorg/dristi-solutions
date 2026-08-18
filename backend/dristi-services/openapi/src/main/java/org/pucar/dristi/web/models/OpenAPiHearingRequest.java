package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
public class OpenAPiHearingRequest {

    @NotNull
    @NotEmpty
    @JsonProperty("tenantId")
    @Valid
    private String tenantId;

    @JsonProperty("searchText")
    @Valid
    private String searchText;

    @JsonProperty("fromDate")
    @NotNull
    @Valid
    private Long fromDate;

    @JsonProperty("toDate")
    @NotNull
    @Valid
    private Long toDate;

    @JsonProperty("isHearingSerialNumberSorting")
    private Boolean isHearingSerialNumberSorting = false;

}
