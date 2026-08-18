package org.pucar.dristi.web.models.payment;

import java.util.Set;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Builder.Default;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillSearchCriteria {

    @NotNull
    @Size(max = 256)
    private String tenantId;

    private Set<String> billId;

    private Long fromPeriod;

    private Long toPeriod;

    @Default
    private Boolean retrieveOldest = false;

    private Boolean isActive;

    private Boolean isCancelled;

    private Set<String> consumerCode;

    @Size(max = 256)
    private String billNumber;

    @Size(max = 256)
    private String service;

    @Default
    private boolean isOrderBy = false;

    private Long size;

    private Long offset;

    @Email
    private String email;

    private BillV2.BillStatus status;

    @Pattern(regexp = "^[0-9]{10}$", message = "MobileNumber should be 10 digit number")
    private String mobileNumber;
}

