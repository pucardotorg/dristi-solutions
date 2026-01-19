package digit.web.models.taskdetails;

import com.fasterxml.jackson.annotation.JsonProperty;
import digit.web.models.Address;
import jakarta.validation.constraints.Email;
import lombok.Builder;
import lombok.Data;
import org.springframework.validation.annotation.Validated;

@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-05-29T13:38:04.562296+05:30[Asia/Calcutta]")
@Data
@Builder
public class RespondentDetails {

    @JsonProperty("uniqueId")
    private String uniqueId;

    @JsonProperty("name")
    private String name;

    @JsonProperty("age")
    private Integer age;

    @JsonProperty("gender")
    private String gender;

    @JsonProperty("email")
    @Email(message = "Email should be valid")
    private String email;

    @JsonProperty("phone")
    private String phone;

    @JsonProperty("address")
    private Address address;

    @JsonProperty("state")
    private String state;

    @JsonProperty("district")
    private String district;

    @JsonProperty("pinCode")
    private String pinCode;

    @JsonProperty("relativeName")
    private String relativeName;

    @JsonProperty("relationWithRelative")
    private String relationWithRelative;
}
