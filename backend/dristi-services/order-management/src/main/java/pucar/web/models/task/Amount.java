package pucar.web.models.task;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Amount   {

    @JsonProperty("id")
    @Valid
    private UUID id = null;

    @JsonProperty("amount")
    @NotNull
    private String amount = null;

    @JsonProperty("type")
    @NotNull
    private String type = null;

    @JsonProperty("paymentRefNumber")
    private String paymentRefNumber = null;

    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;

    @JsonProperty("status")
    @NotNull
    private String status = null;


}