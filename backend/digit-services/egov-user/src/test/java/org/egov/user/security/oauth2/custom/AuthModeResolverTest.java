package org.egov.user.security.oauth2.custom;

import org.egov.user.domain.model.enums.AuthMode;
import org.egov.user.domain.model.enums.UserType;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class AuthModeResolverTest {

    private AuthModeResolver resolverWith(boolean citizenOtpEnabled, boolean employeeOtpEnabled,
                                          String citizenAllowedModes, String employeeAllowedModes) {
        AuthModeResolver resolver = new AuthModeResolver();
        ReflectionTestUtils.setField(resolver, "citizenLoginPasswordOtpEnabled", citizenOtpEnabled);
        ReflectionTestUtils.setField(resolver, "employeeLoginPasswordOtpEnabled", employeeOtpEnabled);
        ReflectionTestUtils.setField(resolver, "citizenAllowedModesConfig", citizenAllowedModes);
        ReflectionTestUtils.setField(resolver, "employeeAllowedModesConfig", employeeAllowedModes);
        ReflectionTestUtils.invokeMethod(resolver, "init");
        return resolver;
    }

    @Test
    public void test_should_fall_back_to_legacy_flags_when_no_auth_mode_requested() {
        AuthModeResolver resolver = resolverWith(true, false, "", "");

        assertEquals(AuthMode.OTP, resolver.resolve(UserType.CITIZEN, null));
        assertEquals(AuthMode.PASSWORD, resolver.resolve(UserType.EMPLOYEE, ""));
    }

    @Test
    public void test_should_drive_non_citizen_types_off_employee_configuration() {
        AuthModeResolver resolver = resolverWith(true, false, "", "");

        assertEquals(AuthMode.PASSWORD, resolver.resolve(UserType.SYSTEM, null));
        assertEquals(AuthMode.PASSWORD, resolver.resolve(UserType.BUSINESS, null));
    }

    @Test
    public void test_should_reject_requested_mode_that_deployment_has_not_enabled() {
        AuthModeResolver resolver = resolverWith(true, false, "", "");

        assertThrows(BadCredentialsException.class, () -> resolver.resolve(UserType.CITIZEN, "PASSWORD"));
        assertThrows(BadCredentialsException.class, () -> resolver.resolve(UserType.EMPLOYEE, "OTP"));
    }

    @Test
    public void test_should_honour_requested_mode_when_allowed() {
        AuthModeResolver resolver = resolverWith(true, false, "OTP,PASSWORD", "PASSWORD,OTP");

        assertEquals(AuthMode.PASSWORD, resolver.resolve(UserType.CITIZEN, "password"));
        assertEquals(AuthMode.OTP, resolver.resolve(UserType.CITIZEN, " otp "));
        assertEquals(AuthMode.OTP, resolver.resolve(UserType.EMPLOYEE, "OTP"));
    }

    @Test
    public void test_should_use_legacy_flag_as_default_even_when_both_modes_allowed() {
        AuthModeResolver resolver = resolverWith(true, false, "OTP,PASSWORD", "OTP,PASSWORD");

        assertEquals(AuthMode.OTP, resolver.resolve(UserType.CITIZEN, null));
        assertEquals(AuthMode.PASSWORD, resolver.resolve(UserType.EMPLOYEE, null));
    }

    @Test
    public void test_should_reject_unknown_auth_mode() {
        AuthModeResolver resolver = resolverWith(true, false, "OTP,PASSWORD", "PASSWORD");

        assertThrows(BadCredentialsException.class, () -> resolver.resolve(UserType.CITIZEN, "BIOMETRIC"));
    }

    @Test
    public void test_should_ignore_unknown_entries_in_configured_allow_list() {
        AuthModeResolver resolver = resolverWith(true, false, "OTP,BIOMETRIC", "PASSWORD");

        assertTrue(resolver.isModeAllowed(UserType.CITIZEN, AuthMode.OTP));
        assertFalse(resolver.isModeAllowed(UserType.CITIZEN, AuthMode.PASSWORD));
    }

    @Test
    public void test_should_fall_back_to_legacy_flag_when_allow_list_has_no_valid_entry() {
        AuthModeResolver resolver = resolverWith(false, true, "BIOMETRIC", "BIOMETRIC");

        assertEquals(AuthMode.PASSWORD, resolver.resolve(UserType.CITIZEN, null));
        assertEquals(AuthMode.OTP, resolver.resolve(UserType.EMPLOYEE, null));
    }

}
