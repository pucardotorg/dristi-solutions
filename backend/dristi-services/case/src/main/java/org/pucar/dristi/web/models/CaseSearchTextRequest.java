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
public class CaseSearchTextRequest {

    @NotNull
    @NotEmpty
    @JsonProperty("tenantId")
    private String tenantId;

    @NotNull
    @NotEmpty
    @JsonProperty("searchText")
    private String searchText;

    @NotNull
    @NotEmpty
    @JsonProperty("courtId")
    private String courtId;

    @JsonProperty("pagination")
    @Valid
    private Pagination pagination;
}
