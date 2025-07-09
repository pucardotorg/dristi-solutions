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
public class Surety {
    @JsonProperty("id")
    private String id;
    @JsonProperty("tenantId")
    private String tenantId;
    @JsonProperty("name")
    private String name;
    @JsonProperty("mobileNumber")
    private String mobileNumber;
    @JsonProperty("address")
    private String address;
    @JsonProperty("email")
    private String email;
    @JsonProperty("documents")
    private List<Document> documents;
    @JsonProperty("isActive")
    private Boolean isActive;
    @JsonProperty("additionalDetails")
    private Object additionalDetails;
    @JsonProperty("workflow")
    private WorkflowObject workflow;
}
