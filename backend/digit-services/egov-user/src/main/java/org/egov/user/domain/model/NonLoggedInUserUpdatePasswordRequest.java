package org.egov.user.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.ToString;

import org.egov.user.domain.exception.InvalidNonLoggedInUserUpdatePasswordRequestException;
import org.egov.user.domain.model.enums.PasswordUpdateVerificationMode;
import org.egov.user.domain.model.enums.UserType;

import static java.util.Objects.isNull;
import static org.egov.user.domain.model.enums.PasswordUpdateVerificationMode.OTP;
import static org.apache.commons.lang3.StringUtils.isEmpty;

@AllArgsConstructor
@Builder
@Getter
@EqualsAndHashCode
@ToString
public class NonLoggedInUserUpdatePasswordRequest {
    private String otpReference;
    private String userName;
    private String newPassword;
    private String tenantId;
    private UserType type;
    private PasswordUpdateVerificationMode verificationMode;

    /**
     * The mode the request is to be verified with, treating an unspecified mode as OTP so that
     * callers written before the field existed keep the stricter behaviour.
     */
    public PasswordUpdateVerificationMode getVerificationMode() {
        return isNull(verificationMode) ? OTP : verificationMode;
    }

    public boolean isOtpVerified() {
        return getVerificationMode() == OTP;
    }

    public void validate() {
        if (isModelInvalid()) {
            throw new InvalidNonLoggedInUserUpdatePasswordRequestException(this);
        }
    }

    public OtpValidationRequest getOtpValidationRequest() {
        return OtpValidationRequest.builder()
                .otpReference(otpReference)
                .mobileNumber(userName)
                .tenantId(tenantId)
                .build();
    }

    /**
     * An OTP is only expected when the request is being verified by OTP, a token verified request
     * carries no otpReference at all.
     */
    public boolean isOtpReferenceAbsent() {
        return isOtpVerified() && isEmpty(otpReference);
    }

    public boolean isUsernameAbsent() {
        return isEmpty(userName);
    }

    public boolean isNewPasswordAbsent() {
        return isEmpty(newPassword);
    }

    public boolean isTenantIdAbsent() {
        return isEmpty(tenantId);
    }

    private boolean isUserTypeAbsent() {
        return isNull(type);
    }


    private boolean isModelInvalid() {
        return isOtpReferenceAbsent() || isUsernameAbsent() || isTenantIdAbsent() || isUserTypeAbsent() || isNewPasswordAbsent();
    }
}
