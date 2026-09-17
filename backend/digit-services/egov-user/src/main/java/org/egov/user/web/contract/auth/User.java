package org.egov.user.web.contract.auth;

import lombok.*;

import java.io.Serializable;
import java.util.Set;

@Setter
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
//This class is serialized to Redis
public class User implements Serializable {
    private static final long serialVersionUID = -1053170163821651014L;
    private Long id;
    private String uuid;
    private String userName;
    private String name;
    private String mobileNumber;
    private String emailId;
    private String locale;
    private String type;
    private Set<Role> roles;
    private boolean active;
    private String tenantId;
    private String permanentCity;
    /**
     * Tells the UI whether to show the "set a password" prompt after login. False once the user
     * has set a password or chosen not to be asked again, and wherever the deployment does not
     * allow this user type to log in with a password.
     */
    private boolean showPasswordSetupPrompt;
}