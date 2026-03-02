package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TasksCriteria {
    @JsonProperty("fileStoreId")
    private String fileStoreId = null;

    @JsonProperty("taskNumber")
    private String taskNumber = null;

    @JsonProperty("placeholder")
    private String placeholder = null;

    @JsonProperty("tenantId")
    private String tenantId = null;
}
