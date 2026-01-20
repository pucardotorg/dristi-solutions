package com.dristi.njdg_transformer.model.advocate;


import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import digit.models.coremodels.user.enums.Gender;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.models.individual.Identifier;
import org.egov.common.models.individual.Name;
import org.springframework.validation.annotation.Validated;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

/**
 * A representation of an Individual.
 */
@Validated

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class IndividualSearch {

    @JsonProperty("id")
    private List<String> id = null;

    @JsonProperty("individualId")
    private String individualId = null;

    @JsonProperty("clientReferenceId")
    private List<String> clientReferenceId = null;

    @JsonProperty("name")
    @Valid
    private Name name = null;

    @JsonProperty("dateOfBirth")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy")
    private Date dateOfBirth = null;

    @JsonProperty("gender")
    @Valid
    private Gender gender = null;

    @JsonProperty("mobileNumber")
    private String mobileNumber = null;

    @JsonProperty("socialCategory")
    private String socialCategory = null;

    @JsonProperty("wardCode")
    private String wardCode = null;

    @JsonProperty("individualName")
    private String individualName = null;

    @JsonProperty("createdFrom")
    private BigDecimal createdFrom = null;

    @JsonProperty("createdTo")
    private BigDecimal createdTo = null;

    @JsonProperty("identifier")
    @Valid
    private Identifier identifier = null;

    @JsonProperty("boundaryCode")
    private String boundaryCode = null;

    @JsonProperty("roleCodes")
    private List<String> roleCodes = null;

    @JsonProperty("username")
    private String username;

    @JsonProperty("userId")
    private Long userId;

    @JsonProperty("userUuid")
    private List<String> userUuid;

    @JsonProperty("latitude")
    private Double latitude;

    @JsonProperty("longitude")
    private Double longitude;

    @JsonProperty("searchRadius")
    private Double searchRadius;

}