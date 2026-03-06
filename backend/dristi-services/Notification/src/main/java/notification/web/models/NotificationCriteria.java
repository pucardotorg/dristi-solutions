package notification.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

/**
 * can send in any one of the values. If multiple parameters are passed, then it will be a logical AND search
 */
@Schema(description = "can send in any one of the values. If multiple parameters are passed, then it will be a logical AND search")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-02-07T11:59:26.022967807+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class NotificationCriteria {

    @JsonProperty("tenantId")
    private String tenantId = null;

    @JsonProperty("id")
    private String id = null;

    @JsonProperty("notificationNumber")
    private String notificationNumber = null;

    @JsonProperty("notificationType")
    private String notificationType = null;

    @JsonProperty("courtId")
    private String courtId = null;

    @JsonProperty("isFuzzySearch")
    private Boolean isFuzzySearch = false;

}
