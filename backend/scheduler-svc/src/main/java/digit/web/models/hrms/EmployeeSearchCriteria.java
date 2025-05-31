package digit.web.models.hrms;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.Size;
import java.util.List;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EmployeeSearchCriteria {


    public List<String> codes;

    public List<String> names;

    public List<String> courtEstablishment;

    public List<String> designations;

    public List<String> courtrooms;

    public Long asOnDate;

    public List<String> roles;

    public List<Long> ids;

    public List<String> employeestatuses;

    public List<String> employeetypes;

    public List<String> uuids;

    public List<Long> positions;

    public Boolean isActive;

    @Size(max = 250)
    public String tenantId;

    public String phone;

    public Integer offset;

    public Integer limit;
}
