package org.egov.individual.web.models;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.annotations.ApiModel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.data.query.annotations.Exclude;
import org.egov.common.models.individual.Gender;
import org.egov.common.models.individual.Identifier;
import org.springframework.validation.annotation.Validated;

import javax.validation.Valid;
import javax.validation.constraints.DecimalMax;
import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

/**
* A representation of an Individual.
*/
    @ApiModel(description = "A representation of an Individual.")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2022-12-27T11:47:19.561+05:30")

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
public class IndividualSearch   {
    @JsonProperty("id")
    @Builder.Default
    private List<String> id = null;

    @JsonProperty("individualId")
    @Builder.Default
    private String individualId = null;

    @JsonProperty("clientReferenceId")
    @Builder.Default
    private List<String> clientReferenceId = null;

    @JsonProperty("name")
    @Valid
    @Builder.Default
    private Name name = null;

    @JsonProperty("dateOfBirth")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy")
    @Builder.Default
    private Date dateOfBirth = null;

    @JsonProperty("gender")
    @Valid
    @Builder.Default
    private Gender gender = null;

    @JsonProperty("mobileNumber")
    @Builder.Default
    private String mobileNumber = null;

    @JsonProperty("socialCategory")
    @Exclude
    @Builder.Default
    private String socialCategory = null;

    @JsonProperty("wardCode")
    @Exclude
    @Builder.Default
    private String wardCode = null;

    @JsonProperty("individualName")
    @Exclude
    @Builder.Default
    private String individualName = null;

    @JsonProperty("createdFrom")
    @Exclude
    @Builder.Default
    private BigDecimal createdFrom = null;

    @JsonProperty("createdTo")
    @Exclude
    @Builder.Default
    private BigDecimal createdTo = null;

    @JsonProperty("identifier")
    @Valid
    @Exclude
    @Builder.Default
    private Identifier identifier = null;

    @JsonProperty("boundaryCode")
    @Exclude
    @Builder.Default
    private String boundaryCode = null;

    @JsonProperty("roleCodes")
    @Exclude
    @Builder.Default
    private List<String> roleCodes = null;

    @Exclude
    @JsonProperty("username")
    private String username;

    @Exclude
    @JsonProperty("userId")
    private Long userId;

    @Exclude
    @JsonProperty("userUuid")
    @Size(min = 1)
    private List<String> userUuid;

    @Exclude
    @JsonProperty("latitude")
    @DecimalMin("-90")
    @DecimalMax("90")
    private Double latitude;

    @Exclude
    @JsonProperty("longitude")
    @DecimalMin("-180")
    @DecimalMax("180")
    private Double longitude;

    /*
    * @value unit of measurement in Kilometer
    * */
    @Exclude
    @JsonProperty("searchRadius")
    @DecimalMin("0")
    private Double searchRadius;

}

