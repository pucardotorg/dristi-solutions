package org.egov.user.domain.service.utils;

import org.egov.tracer.model.CustomException;
import org.egov.user.domain.model.enums.UserType;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class PasswordPolicyResolverTest {

    private static final String STRICT_PATTERN = "((?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%])(?=\\S+$).*$)";
    private static final String PRINTABLE_PATTERN = "^[^\\p{Cntrl}]+$";

    private PasswordPolicyResolver resolver(String citizenPattern, Integer citizenMin, Integer citizenMax) {
        PasswordPolicyResolver resolver = new PasswordPolicyResolver();
        ReflectionTestUtils.setField(resolver, "pattern", STRICT_PATTERN);
        ReflectionTestUtils.setField(resolver, "minLength", 8);
        ReflectionTestUtils.setField(resolver, "maxLength", 15);
        ReflectionTestUtils.setField(resolver, "patternMessage", "strict message");
        ReflectionTestUtils.setField(resolver, "citizenPattern", citizenPattern);
        ReflectionTestUtils.setField(resolver, "citizenMinLength", citizenMin);
        ReflectionTestUtils.setField(resolver, "citizenMaxLength", citizenMax);
        ReflectionTestUtils.setField(resolver, "citizenPatternMessage", "citizen message");
        ReflectionTestUtils.invokeMethod(resolver, "init");
        return resolver;
    }

    private PasswordPolicyResolver citizenPolicyResolver() {
        return resolver(PRINTABLE_PATTERN, 8, 64);
    }

    @Test
    public void test_should_accept_a_citizen_passphrase_containing_spaces() {
        citizenPolicyResolver().validate(UserType.CITIZEN, "correct horse battery staple");
    }

    @Test
    public void test_should_not_require_any_character_class_for_a_citizen() {
        PasswordPolicyResolver resolver = citizenPolicyResolver();

        resolver.validate(UserType.CITIZEN, "alllowercase");
        resolver.validate(UserType.CITIZEN, "12345678");
        resolver.validate(UserType.CITIZEN, "ALLUPPERCASE");
    }

    @Test
    public void test_should_accept_a_citizen_password_of_exactly_the_length_bounds() {
        PasswordPolicyResolver resolver = citizenPolicyResolver();

        resolver.validate(UserType.CITIZEN, "abcdefgh");
        resolver.validate(UserType.CITIZEN, "a".repeat(64));
    }

    @Test
    public void test_should_reject_a_citizen_password_outside_the_length_bounds() {
        PasswordPolicyResolver resolver = citizenPolicyResolver();

        assertTrue(assertThrows(CustomException.class,
                () -> resolver.validate(UserType.CITIZEN, "short7")).getErrors().containsKey("INVALID_PWD_LENGTH"));
        assertTrue(assertThrows(CustomException.class,
                () -> resolver.validate(UserType.CITIZEN, "a".repeat(65))).getErrors().containsKey("INVALID_PWD_LENGTH"));
    }

    @Test
    public void test_should_reject_control_characters_in_a_citizen_password() {
        assertTrue(assertThrows(CustomException.class,
                () -> citizenPolicyResolver().validate(UserType.CITIZEN, "pass\tphrase"))
                .getErrors().containsKey("INVALID_PWD_PATTERN"));
    }

    @Test
    public void test_should_hold_non_citizens_to_the_strict_policy() {
        PasswordPolicyResolver resolver = citizenPolicyResolver();

        /* accepted for a citizen, rejected for everybody else */
        assertThrows(CustomException.class, () -> resolver.validate(UserType.EMPLOYEE, "alllowercase"));
        assertThrows(CustomException.class, () -> resolver.validate(UserType.SYSTEM, "correct horse battery staple"));
        resolver.validate(UserType.EMPLOYEE, "P@ssw0rd");
    }

    @Test
    public void test_should_inherit_the_default_policy_when_citizen_keys_are_unset() {
        PasswordPolicyResolver resolver = resolver(null, null, null);

        assertEquals(15, resolver.resolve(UserType.CITIZEN).getMaxLength());
        assertThrows(CustomException.class, () -> resolver.validate(UserType.CITIZEN, "alllowercase"));
    }

    @Test
    public void test_should_drop_the_pattern_check_when_the_pattern_is_configured_blank() {
        PasswordPolicyResolver resolver = resolver("", 8, 64);

        resolver.validate(UserType.CITIZEN, "pass\tphrase");
        assertThrows(CustomException.class, () -> resolver.validate(UserType.CITIZEN, "short7"));
    }

    @Test
    public void test_should_not_check_a_blank_password() {
        citizenPolicyResolver().validate(UserType.CITIZEN, null);
        citizenPolicyResolver().validate(UserType.CITIZEN, "");
    }

}
