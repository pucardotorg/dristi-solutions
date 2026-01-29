package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SignedBail {
    @JsonProperty("bailId")
    @NotNull
    private String bailId;

    @JsonProperty("signedBailData")
    @NotNull
    private String signedBailData;

    @JsonProperty("signed")
    @NotNull
    private Boolean signed;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("errorMsg")
    private String errorMsg;
}