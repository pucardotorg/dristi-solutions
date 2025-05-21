package digit.web.models.hrms;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.request.User;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Employee {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("uuid")
    private String uuid;

    @JsonProperty("code")
    private String code;

    @JsonProperty("employeeStatus")
    private String employeeStatus;

    @JsonProperty("employeeType")
    private String employeeType;

    @JsonProperty("dateOfAppointment")
    private Long dateOfAppointment;

    @JsonProperty("assignments")
    private List<Assignment> assignments = new ArrayList<>();

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("isActive")
    private Boolean IsActive;

    @JsonProperty("user")
    private User user;

    // this commented entity is also there but not required for now in scheduler, keeping here so that in future no confusion should happen

//    @Valid
//    @Size(max = 25)
//    private List<ServiceHistory> serviceHistory = new ArrayList<>();

//    @Valid
//    @Size(max = 25)
//    private List<EducationalQualification> education = new ArrayList<>();
//
//    @Valid
//    @Size(max = 25)
//    private List<DepartmentalTest> tests = new ArrayList<>();

//    @Valid
//    @Size(max = 50)
//    private List<EmployeeDocument> documents = new ArrayList<>();
//
//    @Valid
//    private List<DeactivationDetails> deactivationDetails = new ArrayList<>();
//
//    private List<ReactivationDetails> reactivationDetails = new ArrayList<>();
//
//    private AuditDetails auditDetails;
//
//    private Boolean reActivateEmployee;




    //    @Valid
//    @NotEmpty
//    @Size(min = 1,max = 50)
//    private List<Jurisdiction> jurisdictions = new ArrayList<>();
}
