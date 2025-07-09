package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    private String bailId;

    @JsonProperty("signedBailData")
    private String signedBailData;

    @JsonProperty("signed")
    private Boolean signed;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("errorMsg")
    private String errorMsg;
}


