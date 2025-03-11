package pucar.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

/**
 * OrderToSign
 */
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2025-03-11T12:54:13.550043793+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OrderToSign {

    @JsonProperty("fileStoreID")
    private String fileStoreID = null;

    @JsonProperty("orderNumber")
    private String orderNumber = null;

    @JsonProperty("orderData")
    @NotNull
    private String orderData = null;

    @JsonProperty("signaturePlaceholder")
    private String signaturePlaceholder = null;


}
