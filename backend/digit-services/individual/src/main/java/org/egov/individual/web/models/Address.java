package org.egov.individual.web.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import digit.models.coremodels.AuditDetails;
import io.swagger.annotations.ApiModel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.models.individual.AddressType;
import org.egov.common.models.individual.Boundary;
import org.springframework.validation.annotation.Validated;

import javax.validation.Valid;
import javax.validation.constraints.DecimalMax;
import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

/**
* Representation of a address. Individual APIs may choose to extend from this using allOf if more details needed to be added in their case. 
*/
    @ApiModel(description = "Representation of a address. Individual APIs may choose to extend from this using allOf if more details needed to be added in their case. ")
@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2022-12-27T11:47:19.561+05:30")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
public class Address   {
        @JsonProperty("id")
    

    @Size(min=2,max=64)
    @Builder.Default
    private String id = null;

    @JsonProperty("clientReferenceId")
    @Size(min = 2, max = 64)
    @Builder.Default
    private String clientReferenceId = null;

    @JsonProperty("individualId")


    @Size(min=2,max=64)
    @Builder.Default
    private String individualId = null;

        @JsonProperty("tenantId")

    @Builder.Default
    private String tenantId = null;

        @JsonProperty("doorNo")
    

    @Size(min=0,max=64)
    @Builder.Default
    private String doorNo = null;

        @JsonProperty("latitude")
    

    @DecimalMin("-90")
    @DecimalMax("90") 
    @Builder.Default
    private Double latitude = null;

        @JsonProperty("longitude")
    

    @DecimalMin("-180")
    @DecimalMax("180") 
    @Builder.Default
    private Double longitude = null;

        @JsonProperty("locationAccuracy")
    

    @DecimalMin("0")
    @DecimalMax("10000") 
    @Builder.Default
    private Double locationAccuracy = null;

        @JsonProperty("type")

        @NotNull
    @Builder.Default
    private AddressType type = null;

        @JsonProperty("addressLine1")
    

    @Size(min=2,max=256) 
    @Builder.Default
    private String addressLine1 = null;

        @JsonProperty("addressLine2")
    

    @Size(min=2,max=256) 
    @Builder.Default
    private String addressLine2 = null;

        @JsonProperty("landmark")
    

    @Size(min=2,max=256) 
    @Builder.Default
    private String landmark = null;

        @JsonProperty("city")
    

    @Size(min=2,max=256) 
    @Builder.Default
    private String city = null;

        @JsonProperty("pincode")
    

    @Size(min=2,max=64) 
    @Builder.Default
    private String pincode = null;

        @JsonProperty("buildingName")
    

    @Size(min=0,max=256)
    @Builder.Default
    private String buildingName = null;

        @JsonProperty("street")
    

    @Size(min=2,max=256) 
    @Builder.Default
    private String street = null;

        @JsonProperty("locality")
    
  @Valid

    @Builder.Default
    private Boundary locality = null;

    @JsonProperty("ward")

    @Valid

    @Builder.Default
    private Boundary ward = null;

    @JsonProperty("isDeleted")



    private Boolean isDeleted = Boolean.FALSE;

    @JsonProperty("auditDetails")

    @Valid

    @Builder.Default
    private AuditDetails auditDetails = null;


}

