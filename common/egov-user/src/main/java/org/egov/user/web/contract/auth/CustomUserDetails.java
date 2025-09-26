package org.egov.user.web.contract.auth;

import lombok.Getter;
import lombok.Setter;
import org.egov.user.domain.model.SecureUser;
import org.egov.user.domain.model.UserDetail;

import java.util.List;
import java.util.Set;

@Getter
@Setter
public class CustomUserDetails {
    private Long id;
    private String userName;
    private String name;
    private String mobileNumber;
    private String emailId;
    private String locale;
    private String type;
    private Set<Role> roles;
    private boolean active;
    private List<Action> actions;
    private String tenantId;
    private String uuid;

    public CustomUserDetails(UserDetail userDetail) {
        this(userDetail, null);
    }

    public CustomUserDetails(UserDetail userDetail, String courtId) {
        final SecureUser secureUser = userDetail.getSecureUser();
        this.id = secureUser.getUser().getId();
        this.userName = secureUser.getUser().getUserName();
        this.name = secureUser.getUser().getName();
        this.mobileNumber = secureUser.getUser().getMobileNumber();
        this.emailId = secureUser.getUser().getEmailId();
        this.locale = secureUser.getUser().getLocale();
        this.type = secureUser.getUser().getType();
        this.roles = filterRolesByCourtId(secureUser.getUser().getRoles(), courtId);
        this.active = secureUser.getUser().isActive();
        this.tenantId = secureUser.getUser().getTenantId();
        this.uuid = secureUser.getUser().getUuid();
//		this.actions = userDetail.getActions().stream().map(Action::new).collect(Collectors.toList());
    }

    /**
     * Filters roles based on courtId if provided
     * 
     * @param roles Original set of roles
     * @param courtId Court ID for filtering (null means no filtering)
     * @return Filtered set of roles
     */
    private Set<Role> filterRolesByCourtId(Set<Role> roles, String courtId) {
        if (roles == null || roles.isEmpty()) {
            return roles;
        }
        
        // If no courtId provided, return all roles
        if (courtId == null || courtId.trim().isEmpty()) {
            return roles;
        }
        
        // Filter roles by courtId - include roles with matching courtId or null courtId (global roles)
        return roles.stream()
                .filter(role -> role.getCourtId() == null || courtId.equals(role.getCourtId()))
                .collect(java.util.stream.Collectors.toSet());
    }
}

