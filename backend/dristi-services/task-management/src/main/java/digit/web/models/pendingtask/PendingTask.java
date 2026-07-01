package digit.web.models.pendingtask;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.User;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PendingTask {

    @JsonProperty("id")
    @Valid
    private String id = null;

    @JsonProperty("name")
    @Valid
    private String name = null;

    @JsonProperty("referenceId")
    @NotNull

    private String referenceId = null;

    @JsonProperty("actionCategory")
    private String actionCategory = null;

    @JsonProperty("entityType")
    @Valid
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
    @NotNull
    private String caseId = null;

    @JsonProperty("caseTitle")
    @NotNull
    private String caseTitle = null;

    @JsonProperty("isCompleted")
    @Valid
    private Boolean isCompleted = null;

    @JsonProperty("stateSla")
    @Valid
    private Long stateSla = null;

    @JsonProperty("businessServiceSla")
    @Valid
    private Long businessServiceSla = null;

    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;

    @JsonProperty("screenType")
    private String screenType = null;

    @JsonProperty("createdTime")
    private Long createdTime = null;

}
