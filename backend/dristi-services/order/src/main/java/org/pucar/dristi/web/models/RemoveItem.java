package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

/**
 * Represents the details of the item to be removed from the order.
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-18T11:13:43.389623100+05:30[Asia/Calcutta]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RemoveItem {

    @JsonProperty("tenantId")
    @NotNull
    private String tenantId;

    @JsonProperty("courtId")
    private String courtId;

    @JsonProperty("orderNumber")
    @NotNull
    private String orderNumber;

    @JsonProperty("itemID")
    @NotNull
    private String itemID;

    @JsonProperty("itemText")
    private String itemText;
}