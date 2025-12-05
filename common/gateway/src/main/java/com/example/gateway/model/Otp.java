package com.example.gateway.model;

import com.example.gateway.model.enums.OtpRequestType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;


@Getter
@AllArgsConstructor
@NoArgsConstructor
@Setter
@ToString
public class Otp {
    private static final String USER_REGISTRATION = "register";
    private static final String PASSWORD_RESET = "passwordreset";
    private static final String USER_LOGIN = "login";
    private String mobileNumber;
    private String tenantId;
    private String type;
    private String userType;

    @JsonIgnore
    public OtpRequestType getTypeOrDefault() {
        return (type == null || type.isEmpty()) ? OtpRequestType.REGISTER : mapToDomainType();
    }

    private OtpRequestType mapToDomainType() {
        if (USER_REGISTRATION.equalsIgnoreCase(type)) {
            return OtpRequestType.REGISTER;
        } else if (USER_LOGIN.equalsIgnoreCase(type)) {
            return OtpRequestType.LOGIN;
        } else if (PASSWORD_RESET.equalsIgnoreCase(type)) {
            return OtpRequestType.PASSWORD_RESET;
        }
        return null;
    }
}

