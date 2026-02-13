package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.validation.annotation.Validated;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Validated
@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-05-16T15:17:16.225735+05:30[Asia/Kolkata]")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EvidenceSearchCriteria {
    private String id;
    private String caseId;
    private String applicationNumber;
    private String artifactType;
    private Boolean isVoid;
    private Boolean evidenceStatus;
    private String hearing;
    private String order;
    private String sourceId;
    private String sourceName;
    private List<String> status;
    private String artifactNumber;
    private String filingNumber;
    private UUID owner;
    private String tenantId;
    private String filingType;
    private String fileStoreId;
    private String courtId;
    private String sourceType;
    private Boolean fuzzySearch = true;
    private List<String> workflowStatus = new ArrayList<>();
    private String evidenceNumber;
    private Boolean isActive = true;
    private Boolean isHideBailCaseBundle = false;

    @JsonIgnore
    private String userUuid;

    @JsonIgnore
    private List<String> officeAdvocateUserUuids = new ArrayList<>();

    @JsonIgnore
    private boolean isCitizen = false;

    @JsonIgnore
    private boolean isAdvocate = false;

    @JsonIgnore
    private boolean isClerk = false;
    
    @JsonProperty("asUser")
    private String asUser = null;

    @JsonIgnore
    private boolean isCourtEmployee = false;

    @JsonIgnore
    private boolean isCourtEmployeeCanSign = false;
    // Getters and setters

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }
    public String getCaseId() {
        return caseId;
    }

    public void setCaseId(String caseId) {
        this.caseId = caseId;
    }

    public String getApplicationNumber() {
        return applicationNumber;
    }

    public void setApplicationNumber(String applicationNumber) {
        this.applicationNumber = applicationNumber;
    }
    public String getFilingNumber() {
        return filingNumber;
    }

    public void setFilingNumber(String filingNumber) {
        this.filingNumber = filingNumber;
    }
    public String getHearing() {
        return hearing;
    }

    public void setHearing(String hearing) {
        this.hearing = hearing;
    }

    public String getOrder() {
        return order;
    }

    public void setOrder(String order) {
        this.order = order;
    }

    public String getSourceId() {
        return sourceId;
    }

    public void setSourceId(String sourceId) {
        this.sourceId = sourceId;
    }

    public String getSourceName() {
        return sourceName;
    }

    public void setSourceName(String sourceName) {
        this.sourceName = sourceName;
    }

    public List<String> getStatus() {
        return status;
    }

    public void setStatus(List<String> status) {
        this.status = status;
    }
    public UUID getOwner() {
        return owner;
    }
    public void setOwner(UUID owner) {
        this.owner = owner;
    }
    public String getArtifactNumber() {
        return artifactNumber;
    }

    public void setArtifactNumber(String artifactNumber) {
        this.artifactNumber = artifactNumber;
    }

    public void setIsCitizen(boolean isCitizen) {
        this.isCitizen = isCitizen;
    }
    public boolean getIsCitizen() {
        return isCitizen;
    }
    public void setIsCourtEmployee(boolean isCourtEmployee) {
        this.isCourtEmployee = isCourtEmployee;
    }
    public boolean getIsCourtEmployee() {
        return isCourtEmployee;
    }
    public Boolean getFuzzySearch() {
        if (fuzzySearch == null) {
            fuzzySearch = true;
        }
        return fuzzySearch;
    }

    public Boolean getIsActive() {
        if(isActive == null) {
            isActive = true;
        }

        return isActive;
    }
}
