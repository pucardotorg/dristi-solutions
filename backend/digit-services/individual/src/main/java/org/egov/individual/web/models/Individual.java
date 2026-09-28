package org.egov.individual.web.models;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import digit.models.coremodels.AuditDetails;
import io.swagger.annotations.ApiModel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.models.individual.*;
import org.springframework.validation.annotation.Validated;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.util.ArrayList;
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
public class Individual {

    @JsonProperty("id")
    @Size(min = 2, max = 64)
    @Builder.Default
    private String id = null;

    @JsonProperty("individualId")
    @Size(min = 2, max = 64)
    @Builder.Default
    private String individualId = null;

    @JsonProperty("tenantId")
    @NotNull
    @Size(min = 2, max = 1000)
    @Builder.Default
    private String tenantId = null;

    @JsonProperty("clientReferenceId")
    @Size(min = 2, max = 64)
    @Builder.Default
    private String clientReferenceId = null;

    @JsonProperty("userId")
    @Builder.Default
    private String userId = null;

    @JsonProperty("userUuid")
    @Builder.Default
    private String userUuid = null;

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

    @JsonProperty("bloodGroup")
    @Valid
    @Builder.Default
    private BloodGroup bloodGroup = null;

    @JsonProperty("mobileNumber")
    @Size(max = 20)
    @Builder.Default
    private String mobileNumber = null;

    @JsonProperty("altContactNumber")
    @Size(max = 16)
    @Builder.Default
    private String altContactNumber = null;

    @JsonProperty("email")
    @Size(min = 5, max = 200)
    @Builder.Default
    private String email = null;

    @JsonProperty("address")
    @Valid
    @Size(max = 3)
    @Builder.Default
    private List<Address> address = null;

    @JsonProperty("fatherName")
    @Size(max = 100)
    @Builder.Default
    private String fatherName = null;

    @JsonProperty("husbandName")
    @Size(max = 100)
    @Builder.Default
    private String husbandName = null;

    @JsonProperty("relationship")
    @Size(max = 100, min = 1)
    @Builder.Default
    private String relationship = null;

    @JsonProperty("identifiers")
    @Valid
    @Builder.Default
    private List<Identifier> identifiers = null;

    @JsonProperty("skills")
    @Valid
    @Builder.Default
    private List<Skill> skills = null;

    @JsonProperty("photo")
    @Builder.Default
    private String photo = null;

    @JsonProperty("additionalFields")
    @Valid
    @Builder.Default
    private AdditionalFields additionalFields = null;

    @JsonProperty("isDeleted")
    private Boolean isDeleted = Boolean.FALSE;

    @JsonProperty("rowVersion")
    @Builder.Default
    private Integer rowVersion = null;

    @JsonProperty("auditDetails")
    @Valid
    @Builder.Default
    private AuditDetails auditDetails = null;

    @JsonProperty("clientAuditDetails")
    @Valid
    @Builder.Default
    private AuditDetails clientAuditDetails = null;

    @JsonIgnore
    private Boolean hasErrors = Boolean.FALSE;

    @JsonProperty("isSystemUser")
    private Boolean isSystemUser = Boolean.FALSE;

    @JsonProperty("isSystemUserActive")
    private Boolean isSystemUserActive = Boolean.TRUE;

    @JsonProperty("userDetails")
    private UserDetails userDetails;


    public Individual addAddressItem(Address addressItem) {
        if (this.address == null) {
            this.address = new ArrayList<>();
        }
        this.address.add(addressItem);
        return this;
    }

    public Individual addIdentifiersItem(Identifier identifiersItem) {
        if (this.identifiers == null) {
            this.identifiers = new ArrayList<>();
        }
        this.identifiers.add(identifiersItem);
        return this;
    }

    public Individual addSkillsItem(Skill skillItem) {
        if (this.skills == null) {
            this.skills = new ArrayList<>();
        }
        this.skills.add(skillItem);
        return this;
    }
}

