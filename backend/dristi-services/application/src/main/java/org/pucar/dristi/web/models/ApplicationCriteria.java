package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.springframework.validation.annotation.Validated;
import jakarta.validation.Valid;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-04-15T11:31:40.281899+05:30[Asia/Kolkata]")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApplicationCriteria {

    @JsonProperty("id")
    private String id = null;

    @JsonProperty("cnrNumber")
    private String cnrNumber = null;

    @JsonProperty("filingNumber")
    private String filingNumber = null;
    @JsonProperty("applicationType")
    private String applicationType = null;
    @JsonProperty("tenantId")
    @NotNull
    private String tenantId = null;

    @JsonProperty("courtId")
    private String courtId = null;

    @JsonProperty("onBehalfOf")
    private List<UUID> onBehalfOf = null;

    @JsonProperty("applicationNumber")
    @Valid
    private String applicationNumber = null;

    @JsonProperty("applicationCMPNumber")
    private String applicationCMPNumber = null;

    @JsonProperty("owner")
    @Valid
    private UUID owner = null;

    @JsonProperty("status")
    @Valid
    private String status = null;

    @JsonProperty("referenceId")
    @Valid
    private String referenceId = null;

    @JsonProperty("isFuzzySearch")
    private Boolean isFuzzySearch = false;

    // TODO : remove this, this is temporary fix (#5016)
    @JsonProperty("isHideBailCaseBundle")
    private Boolean isHideBailCaseBundle = false;

    @JsonIgnore
    private List<String> officeAdvocateUserUuids = new ArrayList<>();

    @JsonIgnore
    private boolean isAdvocate = false;

    @JsonIgnore
    private boolean isClerk = false;
}
