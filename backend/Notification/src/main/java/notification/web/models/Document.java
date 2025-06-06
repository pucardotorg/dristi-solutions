package notification.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Document {

    @JsonProperty("id")
    private String id = null;
    @JsonProperty("documentType")
    private String documentType = null;
    @JsonProperty("fileStore")
    private String fileStore = null;
    @JsonProperty("documentUid")
    private String documentUid = null;
    @JsonProperty("additionalDetails")
    private Object additionalDetails = null;
    @JsonProperty("isActive")
    private Boolean isActive = true;
}
