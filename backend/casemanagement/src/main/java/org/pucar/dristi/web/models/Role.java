package org.pucar.dristi.web.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

/**
 * Enhanced Role class that extends the egov common contract Role and adds courtId field
 * for court-based filtering and access control.
 * 
 * This class maintains full backward compatibility with the existing egov contract Role
 * while adding support for court-specific role filtering.
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
     * Constructor that creates an enhanced Role from an egov contract Role.
     * 
     * @param role The egov contract Role to convert
     */
    public Role(org.egov.common.contract.request.Role role) {
        super();
        if (role != null) {
            this.setCode(role.getCode());
            this.setName(role.getName());
            this.setTenantId(role.getTenantId());
        }
    }

    /**
     * Constructor that creates an enhanced Role from an egov contract Role with courtId.
     * 
     * @param role The egov contract Role to convert
     * @param courtId The court identifier
     */
    public Role(org.egov.common.contract.request.Role role, String courtId) {
        this(role);
        this.courtId = courtId;
    }

    /**
     * Constructor with all fields.
     * 
     * @param name The role name
     * @param code The role code
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
     * @return Enhanced Role with courtId support
     */
    public static Role fromEgovRole(org.egov.common.contract.request.Role egovRole) {
        return new Role(egovRole);
    }

    /**
     * Static factory method to create an enhanced Role from an egov contract Role with courtId.
     * 
     * @param egovRole The egov contract Role to convert
     * @param courtId The court identifier
     * @return Enhanced Role with courtId support
     */
    public static Role fromEgovRole(org.egov.common.contract.request.Role egovRole, String courtId) {
        return new Role(egovRole, courtId);
    }
}
