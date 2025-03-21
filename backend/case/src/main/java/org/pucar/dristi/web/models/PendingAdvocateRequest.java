package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class PendingAdvocateRequest {

    @JsonProperty("advocateId")
    private String advocateId;

    @JsonProperty("status")
    private String status;

    @JsonProperty("taskReferenceNoList")
    private List<String> taskReferenceNoList;
}
