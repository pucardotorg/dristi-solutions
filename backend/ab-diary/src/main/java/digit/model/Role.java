package digit.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

/**
 * Enhanced Role class that extends the egov common contract Role and adds courtId field
 * for court-based filtering in the ab-diary project.
 * 
 * This class maintains full backward compatibility with the existing egov contract Role
 * while adding court-specific functionality for multi-court environments.
 * 
 * @author Dristi Solutions Team
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
     * Constructor to create enhanced Role from egov contract Role.
     * 
     * @param egovRole The egov contract Role to convert
     */
    public Role(org.egov.common.contract.request.Role egovRole) {
        if (egovRole != null) {
            this.setCode(egovRole.getCode());
            this.setName(egovRole.getName());
            this.setTenantId(egovRole.getTenantId());
        }
    }

    /**
     * Constructor to create enhanced Role from egov contract Role with courtId.
     * 
     * @param egovRole The egov contract Role to convert
     * @param courtId The court identifier
     */
    public Role(org.egov.common.contract.request.Role egovRole, String courtId) {
        this(egovRole);
        this.courtId = courtId;
    }

    /**
     * Constructor with all fields for creating a complete Role object.
     * 
     * @param name The role name
     * @param code The role code
     * @param tenantId The tenant identifier
     * @param courtId The court identifier
     */
    public Role(String name, String code, String tenantId, String courtId) {
        this.setName(name);
        this.setCode(code);
        this.setTenantId(tenantId);
        this.courtId = courtId;
    }

    /**
     * Static factory method to create enhanced Role from egov contract Role.
     * 
     * @param egovRole The egov contract Role to convert
     * @return Enhanced Role object with courtId support
     */
    public static Role fromEgovRole(org.egov.common.contract.request.Role egovRole) {
        return new Role(egovRole);
    }

    /**
     * Static factory method to create enhanced Role from egov contract Role with courtId.
     * 
     * @param egovRole The egov contract Role to convert
     * @param courtId The court identifier
     * @return Enhanced Role object with courtId
     */
    public static Role fromEgovRole(org.egov.common.contract.request.Role egovRole, String courtId) {
        return new Role(egovRole, courtId);
    }
}
