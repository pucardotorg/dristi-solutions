package org.egov.user.domain.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

/**
 * How the caller of the no-login password update proves the account being updated is theirs.
 * OTP   - the caller supplies an otpReference, which is validated against the mobile number held on
 *         the stored user. Used by the forgot-password flow, where there is no session yet.
 * TOKEN - the caller is already logged in, so the user resolved from the auth token must be the very
 *         user being updated. No OTP is required or looked at.
 */
public enum PasswordUpdateVerificationMode {
    OTP, TOKEN;

    /**
     * Absent or unrecognised values fall back to OTP, which is the stricter of the two modes and
     * keeps callers written before this field existed working unchanged.
     */
    @JsonCreator
    public static PasswordUpdateVerificationMode fromValue(String text) {
        for (PasswordUpdateVerificationMode mode : PasswordUpdateVerificationMode.values()) {
            if (String.valueOf(mode).equalsIgnoreCase(text)) {
                return mode;
            }
        }
        return OTP;
    }
}
