package digit.web.models.cases;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;

@Validated
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AdvocateOffice {

    @JsonProperty("officeAdvocateId")
    private String officeAdvocateId = null;

    @JsonProperty("officeAdvocateName")
    private String officeAdvocateName = null;

    @JsonProperty("officeAdvocateUserUuid")
    private String officeAdvocateUserUuid = null;

    @JsonProperty("advocates")
    @Valid
    @Builder.Default
    private List<AdvocateOfficeMember> advocates = new ArrayList<>();

    @JsonProperty("clerks")
    @Valid
    @Builder.Default
    private List<AdvocateOfficeMember> clerks = new ArrayList<>();

}
