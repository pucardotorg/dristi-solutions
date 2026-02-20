package digit.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.util.UUID;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CaseMemberInfo {

    @JsonProperty("caseId")
    @Valid
    private UUID caseId = null;

    @JsonProperty("filingNumber")
    private String filingNumber = null;

    @JsonProperty("cmpNumber")
    private String cmpNumber = null;

    @JsonProperty("courtCaseNumber")
    private String courtCaseNumber = null;

    @JsonProperty("caseTitle")
    private String caseTitle = null;

    @JsonProperty("isActive")
    private Boolean isActive = null;

}
