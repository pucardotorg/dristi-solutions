package notification.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;

/**
 * NotificationExistsRequest
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-02-07T11:59:26.022967807+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class NotificationExistsRequest {

    @JsonProperty("RequestInfo")
    @Valid
    private RequestInfo requestInfo = null;

    @JsonProperty("notificationList")
    @Valid
    @NotNull
    @NotEmpty
    private List<NotificationExists> notificationList = null;


    public NotificationExistsRequest addNotificationListItem(NotificationExists notificationListItem) {
        if (this.notificationList == null) {
            this.notificationList = new ArrayList<>();
        }
        this.notificationList.add(notificationListItem);
        return this;
    }

}
