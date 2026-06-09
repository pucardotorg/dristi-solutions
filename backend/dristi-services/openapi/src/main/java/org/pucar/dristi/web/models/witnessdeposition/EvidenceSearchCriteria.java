package org.pucar.dristi.web.models.witnessdeposition;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.util.UUID;

@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-05-16T15:17:16.225735+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EvidenceSearchCriteria {

    @JsonProperty("id")
    private String id;

    @JsonProperty("caseId")
    private String caseId;

    @JsonProperty("applicationNumber")
    private String applicationNumber;

    @JsonProperty("artifactType")
    private String artifactType;

    @JsonProperty("isVoid")
    private Boolean isVoid;

    @JsonProperty("evidenceStatus")
    private Boolean evidenceStatus;

    @JsonProperty("hearing")
    private String hearing;

    @JsonProperty("order")
    private String order;

    @JsonProperty("sourceId")
    private String sourceId;

    @JsonProperty("sourceName")
    private String sourceName;

    @JsonProperty("status")
    private String status;

    @JsonProperty("artifactNumber")
    private String artifactNumber;

    @JsonProperty("filingNumber")
    private String filingNumber;

    @JsonProperty("owner")
    private UUID owner;

    @JsonProperty("tenantId")
    private String tenantId;

    @JsonProperty("filingType")
    private String filingType;

    @JsonProperty("fileStoreId")
    private String fileStoreId;

    @JsonProperty("courtId")
    private String courtId;

    @JsonProperty("sourceType")
    private String sourceType;

    @JsonIgnore
    private String userUuid;

    @JsonIgnore
    private boolean isCitizen = false;

    @JsonIgnore
    private boolean isCourtEmployee = false;

    @JsonIgnore
    private boolean isCourtEmployeeCanSign = false;

    @JsonProperty("fuzzySearch")
    private Boolean fuzzySearch = true;

}
