package org.egov.eTreasury.model;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Getter
@AllArgsConstructor
@NoArgsConstructor
@ToString
@Builder
public class SMSRequest {

    @Pattern(regexp = "^[0-9]{10}$", message = "MobileNumber should be 10 digit number")
    private String mobileNumber;

    @Size(max = 1000)
    private String message;

    private String category;
    private Long expiryTime;
    private String templateId;

    //Unused for future upgrades
    private String locale;
    private String tenantId;
    private String email;
    private String[] users;

    private String contentType;

}
