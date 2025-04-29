package org.egov.infra.indexer.custom.courtCase;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@JsonIgnoreProperties(ignoreUnknown = true)
public class PendingAdvocateRequest {

    @JsonProperty("advocateId")
    private String advocateId;

    @JsonProperty("status")
    private String status;

    @JsonProperty("taskReferenceNoList")
    private List<String> taskReferenceNoList;

    @JsonProperty("individualDetails")
    private IndividualDetails individualDetails;
    public void addTaskReferenceNoList (List<String> taskReferenceNoList) {
        if(this.taskReferenceNoList == null) {
            this.taskReferenceNoList = new ArrayList<>();
        }
        this.taskReferenceNoList.addAll(taskReferenceNoList);
    }
}