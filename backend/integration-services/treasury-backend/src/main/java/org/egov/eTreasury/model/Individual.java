package org.egov.eTreasury.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class Individual {

    @JsonProperty("id")
    @Size(min = 2, max = 64)
    private String id = null;

    @JsonProperty("individualId")
    @Size(min = 2, max = 64)
    private String individualId = null;

    @JsonProperty("tenantId")
    @NotNull
    @Size(min = 2, max = 1000)
    private String tenantId = null;

    @JsonProperty("clientReferenceId")
    @Size(min = 2, max = 64)
    private String clientReferenceId = null;

    @JsonProperty("userId")
    private String userId = null;

    @JsonProperty("userUuid")
    private String userUuid = null;

    @JsonProperty("dateOfBirth")
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd/MM/yyyy")
    private Date dateOfBirth = null;

    @JsonProperty("mobileNumber")
    @Size(max = 20)
    private String mobileNumber = null;

    @JsonProperty("altContactNumber")
    @Size(max = 16)
    private String altContactNumber = null;

    @JsonProperty("email")
    @Size(min = 5, max = 200)
    private String email = null;

    @JsonProperty("address")
    @Valid
    @Size(max = 3)
    private List<Object> address = null;

}
