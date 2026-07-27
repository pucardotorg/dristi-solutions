package org.egov.user.domain.model.enums;

/**
 * Credential type presented in the "password" field of the /oauth/token request.
 * OTP      - the value is a one time password, validated against otp service
 * PASSWORD - the value is the user's password, matched against the stored bcrypt hash
 */
public enum AuthMode {
    OTP, PASSWORD;

    public static AuthMode fromValue(String text) {
        for (AuthMode authMode : AuthMode.values()) {
            if (String.valueOf(authMode).equalsIgnoreCase(text)) {
                return authMode;
            }
        }
        return null;
    }
}
