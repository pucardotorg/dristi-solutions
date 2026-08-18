package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.RequestInfo;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UpdateSignedTaskRequest {
    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo;

    @JsonProperty("signedTasks")
    private List<SignedTask> signedTasks;

    public UpdateSignedTaskRequest addSignedTaskItem(SignedTask signedTask) {
        if(this.signedTasks == null){
            signedTasks = new ArrayList<>();
        }
        this.signedTasks.add(signedTask);
        return this;
    }

}
