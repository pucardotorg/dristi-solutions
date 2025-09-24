package com.example.gateway.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.io.Serializable;

/**
 * Enhanced Role class that extends the egov common contract Role functionality
 * with court-specific filtering capabilities through courtId field.
 * 
 * This class maintains backward compatibility with the existing egov contract Role
 * while adding support for court-based role filtering and access control.
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@Data
@EqualsAndHashCode(of = {"code", "tenantId", "courtId"})
public class Role extends org.egov.common.contract.request.Role implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * Court identifier for court-based role filtering and access control.
     * This field enables role-specific permissions based on court context,
     * allowing users to have different roles in different courts.
     */
    @JsonProperty("courtId")
    private String courtId;
    
    /**
     * Default constructor for Role
     */
    public Role() {
        super();
    }
    
    /**
     * Constructor to create enhanced Role from egov contract Role
     * @param egovRole the egov contract Role to extend
     */
    public Role(org.egov.common.contract.request.Role egovRole) {
        super();
        if (egovRole != null) {
            this.setCode(egovRole.getCode());
            this.setName(egovRole.getName());
            this.setTenantId(egovRole.getTenantId());
        }
    }
    
    /**
     * Constructor to create enhanced Role from egov contract Role with courtId
     * @param egovRole the egov contract Role to extend
     * @param courtId the court identifier
     */
    public Role(org.egov.common.contract.request.Role egovRole, String courtId) {
        this(egovRole);
        this.courtId = courtId;
    }
    
    /**
     * Constructor with all fields including courtId
     * @param name role name
     * @param code role code
     * @param tenantId tenant identifier
     * @param courtId court identifier
     */
    public Role(Long id, String name, String code, String tenantId, String courtId) {
        super(id, name, code, tenantId);
        this.courtId = courtId;
    }
    
    /**
     * Creates a Role instance from egov contract Role with optional courtId
     * @param egovRole the source egov contract Role
     * @param courtId the court identifier (can be null)
     * @return new Role instance with courtId
     */
    public static Role fromEgovRole(org.egov.common.contract.request.Role egovRole, String courtId) {
        return new Role(egovRole, courtId);
    }
    
    /**
     * Creates a Role instance from egov contract Role without courtId
     * @param egovRole the source egov contract Role
     * @return new Role instance
     */
    public static Role fromEgovRole(org.egov.common.contract.request.Role egovRole) {
        return new Role(egovRole);
    }
}
