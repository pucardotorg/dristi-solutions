package digit.web.models.demand;

import digit.web.models.demand.enums.Type;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Builder.Default;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DemandCriteria {

    @NotNull
    private String tenantId;

    private Set<String> demandId;

    private Set<String> payer;

    private Set<String> consumerCode;

    private String businessService;

    private BigDecimal demandFrom;

    private BigDecimal demandTo;

    private Long periodFrom;

    private Long periodTo;

    private Type type;

    private String mobileNumber;

    private String email;

    private String status;

    private Boolean isPaymentCompleted;

    @Default
    private Boolean receiptRequired = false;
}
