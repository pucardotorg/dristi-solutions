package org.pucar.dristi.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

/**
 * Enhanced Role class that extends the common contract Role and adds courtId field
 * for court-based filtering and access control in the analytics module.
 * 
 * This class maintains full backward compatibility with the existing egov contract Role
 * while adding court-specific capabilities for multi-court environments.
 */
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(of = {"code", "tenantId", "courtId"}, callSuper = false)
public class Role extends org.egov.common.contract.request.Role implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * Court identifier for court-based role filtering and access control.
     * This field enables users to have different roles in different courts.
     */
    @JsonProperty("courtId")
    private String courtId;

    /**
     * Constructor that creates an enhanced Role from an existing egov contract Role.
     * 
     * @param role The egov contract Role to copy from
     */
    public Role(org.egov.common.contract.request.Role role) {
        super();
        if (role != null) {
            this.setName(role.getName());
            this.setCode(role.getCode());
            this.setTenantId(role.getTenantId());
        }
    }

    /**
     * Constructor that creates an enhanced Role from an existing egov contract Role
     * with a specific courtId.
     * 
     * @param role The egov contract Role to copy from
     * @param courtId The court identifier for this role
     */
    public Role(org.egov.common.contract.request.Role role, String courtId) {
        this(role);
        this.courtId = courtId;
    }

    /**
     * Constructor with all fields for creating a complete Role object.
     * 
     * @param name The display name of the role
     * @param code The unique code identifying the role
     * @param tenantId The tenant identifier
     * @param courtId The court identifier
     */
    public Role(String name, String code, String tenantId, String courtId) {
        super();
        this.setName(name);
        this.setCode(code);
        this.setTenantId(tenantId);
        this.courtId = courtId;
    }

    /**
     * Static factory method to create an enhanced Role from an egov contract Role.
     * 
     * @param egovRole The egov contract Role to convert
     * @return Enhanced Role with courtId support, or null if input is null
     */
    public static Role fromEgovRole(org.egov.common.contract.request.Role egovRole) {
        if (egovRole == null) {
            return null;
        }
        return new Role(egovRole);
    }

    /**
     * Static factory method to create an enhanced Role from an egov contract Role
     * with a specific courtId.
     * 
     * @param egovRole The egov contract Role to convert
     * @param courtId The court identifier for this role
     * @return Enhanced Role with courtId support, or null if input is null
     */
    public static Role fromEgovRole(org.egov.common.contract.request.Role egovRole, String courtId) {
        if (egovRole == null) {
            return null;
        }
        return new Role(egovRole, courtId);
    }
}
