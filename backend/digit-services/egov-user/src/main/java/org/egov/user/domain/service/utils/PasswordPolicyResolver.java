package org.egov.user.domain.service.utils;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import jakarta.annotation.PostConstruct;

import org.egov.tracer.model.CustomException;
import org.egov.user.domain.model.enums.UserType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

/**
 * Applies the password policy of the user type a password is being set for.
 *
 * Citizens may be held to a different policy from everybody else, declared through the
 * egov.user.citizen.pwd.* properties. Any of those left unset falls back to the corresponding
 * egov.user.pwd.* value, so a deployment that does not configure them keeps the single policy it
 * has always had.
 */
@Component
@Slf4j
public class PasswordPolicyResolver {

    private static final String DEFAULT_PATTERN_MESSAGE = "Password MUST HAVE: Atleast one digit, "
            + "one upper case, one lower case, one special character (@#$%) and MUST NOT contain any spaces";

    @Value("${egov.user.pwd.pattern}")
    private String pattern;

    @Value("${egov.user.pwd.pattern.min.length}")
    private Integer minLength;

    @Value("${egov.user.pwd.pattern.max.length}")
    private Integer maxLength;

    @Value("${egov.user.pwd.pattern.message:#{null}}")
    private String patternMessage;

    /* Null rather than blank as the default, so that a deliberately blank pattern can switch the
     * pattern check off without being mistaken for "not configured". */
    @Value("${egov.user.citizen.pwd.pattern:#{null}}")
    private String citizenPattern;

    @Value("${egov.user.citizen.pwd.pattern.min.length:#{null}}")
    private Integer citizenMinLength;

    @Value("${egov.user.citizen.pwd.pattern.max.length:#{null}}")
    private Integer citizenMaxLength;

    @Value("${egov.user.citizen.pwd.pattern.message:#{null}}")
    private String citizenPatternMessage;

    private PasswordPolicy defaultPolicy;
    private PasswordPolicy citizenPolicy;

    @PostConstruct
    void init() {
        if (patternMessage == null)
            patternMessage = DEFAULT_PATTERN_MESSAGE;

        defaultPolicy = new PasswordPolicy(minLength, maxLength, pattern, patternMessage);
        citizenPolicy = new PasswordPolicy(
                citizenMinLength == null ? minLength : citizenMinLength,
                citizenMaxLength == null ? maxLength : citizenMaxLength,
                citizenPattern == null ? pattern : citizenPattern,
                citizenPatternMessage == null ? patternMessage : citizenPatternMessage);
        log.info("Password policy - citizen: {}, default: {}", citizenPolicy, defaultPolicy);
    }

    public PasswordPolicy resolve(UserType userType) {
        return UserType.CITIZEN.equals(userType) ? citizenPolicy : defaultPolicy;
    }

    /**
     * Validates a password against the policy of the given user type. A blank password is not
     * checked, mirroring the long standing behaviour where a user may be created without one.
     *
     * @param userType type of the user the password is being set for
     * @param password raw password, may be blank
     */
    public void validate(UserType userType, String password) {
        if (!StringUtils.hasLength(password))
            return;

        PasswordPolicy policy = resolve(userType);
        Map<String, String> errorMap = new HashMap<>();

        if (password.length() < policy.getMinLength() || password.length() > policy.getMaxLength())
            errorMap.put("INVALID_PWD_LENGTH", "Password must be of minimum: " + policy.getMinLength()
                    + " and maximum: " + policy.getMaxLength() + " characters.");

        if (StringUtils.hasLength(policy.getPattern())) {
            Matcher matcher = Pattern.compile(policy.getPattern()).matcher(password);
            if (!matcher.find())
                errorMap.put("INVALID_PWD_PATTERN", policy.getPatternMessage());
        }

        if (!CollectionUtils.isEmpty(errorMap.keySet()))
            throw new CustomException(errorMap);
    }

    @Getter
    @AllArgsConstructor
    public static class PasswordPolicy {
        private final int minLength;
        private final int maxLength;
        /* Blank switches the pattern check off, leaving only the length bounds */
        private final String pattern;
        private final String patternMessage;

        @Override
        public String toString() {
            return "minLength=" + minLength + ", maxLength=" + maxLength + ", pattern=" + pattern;
        }
    }

}
