package pucar.web.models.taskManagement;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

import jakarta.validation.constraints.NotNull;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.Builder;

/**
 * TaskSearchCriteria
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-10-27T11:32:01.103620686+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TaskSearchCriteria {

    @JsonProperty("id")
    @Valid
    private String id = null;

    @JsonProperty("courtId")
    @Valid
    private String courtId = null;

    @JsonProperty("tenantId")
    @Valid
    @NotNull
    private String tenantId;

    @JsonProperty("taskManagementNumber")
    private String taskManagementNumber;

    @JsonProperty("orderNumber")
    private String orderNumber = null;

    @JsonProperty("orderItemId")
    private String orderItemId = null;

    @JsonProperty("filingNumber")
    private String filingNumber;

    @JsonProperty("status")
    private String status = null;

    @JsonProperty("taskType")
    private List<String> taskType = null;

}
