package org.egov.inbox.web.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import javax.validation.constraints.NotNull;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AbDiaryCriteria {

    @NotNull
    @JsonProperty("courtId")
    private String courtId;

    @NotNull
    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("date")
    private Long date;
}