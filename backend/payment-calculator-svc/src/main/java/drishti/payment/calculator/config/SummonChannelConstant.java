package drishti.payment.calculator.config;


import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@NoArgsConstructor
public class SummonChannelConstant {

    public static final String EPOST = "drishti.payment.calculator.service.EPostSummonFeesCalculation";
    public static final String POLICE = "drishti.payment.calculator.service.EPoliceSummonFeesCalculation";

    public static final String ICOPS = "";
    public static final String EMAIL = "";
    public static final String SMS = "";

}
