package org.pucar.dristi.web.models.payment;

import java.util.HashSet;
import java.util.Set;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class GenerateBillCriteria {

    @NotNull
    @Size(max = 256)
    private String tenantId;

    @Size(max = 64)
    private String demandId;

    private Set<String> consumerCode;

    @NotNull
    @Size(max = 256)
    private String businessService;

    @Email
    private String email;

    @Pattern(regexp = "^[0-9]{10}$", message = "MobileNumber should be 10 digit number")
    private String mobileNumber;

    public DemandCriteria toDemandCriteria() {

        Set<String> consumerCodeSet = new HashSet<>();
        consumerCodeSet.addAll(consumerCode);

        Set<String> demandIdSet = new HashSet<>();
        demandIdSet.add(demandId);

        return DemandCriteria.builder()
                .businessService(businessService)
                .consumerCode(consumerCodeSet)
                .mobileNumber(mobileNumber)
                .isPaymentCompleted(false)
                .demandId(demandIdSet)
                .tenantId(tenantId)
                .email(email)
                .build();
    }

    /**
     * Converts Gen Bill criteria to search bill criteria to fetch only active bills
     *
     * @return BillSearchCriteria
     */
    public BillSearchCriteria toBillSearchCriteria() {

        return BillSearchCriteria.builder()
                .consumerCode(consumerCode)
                .mobileNumber(mobileNumber)
                .status(BillV2.BillStatus.ACTIVE)
                .service(businessService)
                .tenantId(tenantId)
                .isOrderBy(true)
                .email(email)
                .build();
    }

}
