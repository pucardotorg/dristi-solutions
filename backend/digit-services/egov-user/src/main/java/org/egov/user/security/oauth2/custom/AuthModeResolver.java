package org.egov.user.security.oauth2.custom;

import java.util.EnumSet;
import java.util.Set;

import jakarta.annotation.PostConstruct;

import org.egov.user.domain.model.enums.AuthMode;
import org.egov.user.domain.model.enums.UserType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import lombok.extern.slf4j.Slf4j;

/**
 * Decides whether the credential supplied on /oauth/token is an OTP or a password.
 *
 * A deployment declares which modes a user type may use via
 * citizen.login.auth.modes.allowed / employee.login.auth.modes.allowed. When those are
 * left empty the allowed set falls back to the single mode implied by the legacy
 * *.login.password.otp.enabled flags, so existing environments keep behaving as before.
 *
 * The mode the client asks for is only honoured if the deployment allows it, so a client
 * can never downgrade authentication by picking a mode the environment has not enabled.
 */
@Component
@Slf4j
public class AuthModeResolver {

    @Value("${citizen.login.password.otp.enabled}")
    private boolean citizenLoginPasswordOtpEnabled;

    @Value("${employee.login.password.otp.enabled}")
    private boolean employeeLoginPasswordOtpEnabled;

    @Value("${citizen.login.auth.modes.allowed:}")
    private String citizenAllowedModesConfig;

    @Value("${employee.login.auth.modes.allowed:}")
    private String employeeAllowedModesConfig;

    private Set<AuthMode> citizenAllowedModes;
    private Set<AuthMode> employeeAllowedModes;

    @PostConstruct
    void init() {
        citizenAllowedModes = parse(citizenAllowedModesConfig, defaultMode(true));
        employeeAllowedModes = parse(employeeAllowedModesConfig, defaultMode(false));
        log.info("Allowed login auth modes - citizen: {}, employee: {}", citizenAllowedModes, employeeAllowedModes);
    }

    /**
     * Resolves the mode to authenticate with.
     *
     * @param userType         type of the user logging in
     * @param requestedAuthMode value of the authType request param, may be blank
     * @return the requested mode when supplied and permitted, the deployment default otherwise
     */
    public AuthMode resolve(UserType userType, String requestedAuthMode) {
        if (!StringUtils.hasText(requestedAuthMode))
            return defaultMode(isCitizen(userType));

        AuthMode requested = AuthMode.fromValue(requestedAuthMode.trim());
        if (requested == null)
            throw new BadCredentialsException("Invalid authType, expected one of " + EnumSet.allOf(AuthMode.class));

        if (!getAllowedModes(userType).contains(requested))
            throw new BadCredentialsException("authType " + requested + " is not enabled for user type " + userType);

        return requested;
    }

    public Set<AuthMode> getAllowedModes(UserType userType) {
        return isCitizen(userType) ? citizenAllowedModes : employeeAllowedModes;
    }

    public boolean isModeAllowed(UserType userType, AuthMode authMode) {
        return getAllowedModes(userType).contains(authMode);
    }

    private AuthMode defaultMode(boolean isCitizen) {
        boolean otpBased = isCitizen ? citizenLoginPasswordOtpEnabled : employeeLoginPasswordOtpEnabled;
        return otpBased ? AuthMode.OTP : AuthMode.PASSWORD;
    }

    /**
     * Every user type other than CITIZEN is driven by the employee configuration, mirroring
     * the citizen/non-citizen split the login flow has always used.
     */
    private boolean isCitizen(UserType userType) {
        return UserType.CITIZEN.equals(userType);
    }

    private Set<AuthMode> parse(String config, AuthMode fallback) {
        Set<AuthMode> modes = EnumSet.noneOf(AuthMode.class);
        if (StringUtils.hasText(config)) {
            for (String value : config.split(",")) {
                AuthMode mode = AuthMode.fromValue(value.trim());
                if (mode == null)
                    log.warn("Ignoring unknown login auth mode in configuration: {}", value);
                else
                    modes.add(mode);
            }
        }
        return modes.isEmpty() ? EnumSet.of(fallback) : modes;
    }

}
