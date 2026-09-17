package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.User;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;

@Schema(description = "Pending task indexed by the analytics service")
@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PendingTask {

    @JsonProperty("id")
    private String id = null;

    @JsonProperty("name")
    private String name = null;

    @JsonProperty("referenceId")
    @NotNull
    private String referenceId = null;

    @JsonProperty("entityType")
    private String entityType = null;

    @JsonProperty("status")
    @NotNull
    private String status = null;

    @JsonProperty("assignedTo")
    private List<User> assignedTo = new ArrayList<>();

    @JsonProperty("assignedRole")
    private List<String> assignedRole = new ArrayList<>();

    @JsonProperty("cnrNumber")
    private String cnrNumber = null;

    @JsonProperty("filingNumber")
    @NotNull
    private String filingNumber = null;

    @JsonProperty("caseId")
    private String caseId = null;

    @JsonProperty("caseTitle")
    private String caseTitle = null;

    @JsonProperty("isCompleted")
    private Boolean isCompleted = null;

    @JsonProperty("stateSla")
    private Long stateSla = null;

    @JsonProperty("businessServiceSla")
    private Long businessServiceSla = null;

    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;

    @JsonProperty("screenType")
    private String screenType = null;

}
