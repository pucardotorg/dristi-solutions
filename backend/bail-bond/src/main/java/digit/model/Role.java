package digit.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

/**
 * Enhanced Role class that extends the egov common contract Role to add court-based filtering capability.
 * This class maintains full backward compatibility with the existing egov framework while adding
 * support for court-specific role filtering through the courtId field.
 * 
 * The courtId field enables multi-court environments where users can have different roles
 * in different courts, supporting fine-grained access control and role-based permissions.
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
     * This field enables the same user to have different roles in different courts.
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
            this.setId(egovRole.getId());
        }
    }

    /**
     * Constructor to create enhanced Role from egov contract Role with courtId.
     * 
     * @param egovRole The egov contract Role to convert
     * @param courtId The court identifier for this role
     */
    public Role(org.egov.common.contract.request.Role egovRole, String courtId) {
        this(egovRole);
        this.courtId = courtId;
    }

    /**
     * Constructor with all fields for creating a complete Role object.
     * 
     * @param name The display name of the role
     * @param code The unique code identifying the role
     * @param tenantId The tenant identifier
     * @param courtId The court identifier for court-based filtering
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
     * @return Enhanced Role with courtId support
     */
    public static Role fromEgovRole(org.egov.common.contract.request.Role egovRole) {
        return new Role(egovRole);
    }

    /**
     * Static factory method to create enhanced Role from egov contract Role with courtId.
     * 
     * @param egovRole The egov contract Role to convert
     * @param courtId The court identifier for this role
     * @return Enhanced Role with courtId support
     */
    public static Role fromEgovRole(org.egov.common.contract.request.Role egovRole, String courtId) {
        return new Role(egovRole, courtId);
    }
}
