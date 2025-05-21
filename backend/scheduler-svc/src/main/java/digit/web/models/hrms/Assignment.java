package digit.web.models.hrms;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Assignment {

    @JsonProperty("id")
    private String id;

    @JsonProperty("position")
    private Long position;

    @JsonProperty("district")
    private String district;

    @JsonProperty("designation")
    private String designation;

    @JsonProperty("courtEstablishment")
    private String courtEstablishment;

    @JsonProperty("courtroom")
    private String courtroom;

    @JsonProperty("fromDate")
    private Long fromDate;

    @JsonProperty("toDate")
    private Long toDate;

    @JsonProperty("govtOrderNumber")
    private String govtOrderNumber;

    @JsonProperty("tenantid")
    private String tenantid;

    @JsonProperty("reportingTo")
    private String reportingTo;

    @JsonProperty("isHOD")
    private Boolean isHOD = false;

    @JsonProperty("isCurrentAssignment")
    private Boolean isCurrentAssignment;

}
