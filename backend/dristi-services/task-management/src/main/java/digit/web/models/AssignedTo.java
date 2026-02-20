package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.UUID;

import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.Builder;

/**
 * details of person this task is assigned to. For example in case of document upload, this could be litigant or lawyer. In case of summon task, this will be person to whom summon is issued
 */
@Schema(description = "details of person this task is assigned to. For example in case of document upload, this could be litigant or lawyer. In case of summon task, this will be person to whom summon is issued")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-10-27T11:32:01.103620686+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AssignedTo {

    @JsonProperty("individualId")
    @Valid
    private UUID individualId = null;

    @JsonProperty("name")

    private String name = null;


}
