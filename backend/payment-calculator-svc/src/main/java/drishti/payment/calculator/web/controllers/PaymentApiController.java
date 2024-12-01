package drishti.payment.calculator.web.controllers;


import drishti.payment.calculator.service.CaseFeeCalculationService;
import drishti.payment.calculator.service.PaymentCalculationService;
import drishti.payment.calculator.util.ResponseInfoFactory;
import drishti.payment.calculator.web.models.Calculation;
import drishti.payment.calculator.web.models.CalculationRes;
import drishti.payment.calculator.web.models.EFillingCalculationReq;
import drishti.payment.calculator.web.models.TaskPaymentRequest;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@jakarta.annotation.Generated(value = "org.egov.codegen.SpringBootCodegen", date = "2024-06-10T14:05:42.847785340+05:30[Asia/Kolkata]")
@Controller
@RequestMapping("")
@Slf4j
public class PaymentApiController {

    private final CaseFeeCalculationService caseFeesService;
    private final PaymentCalculationService summonCalculationService;

    @Autowired
    public PaymentApiController(CaseFeeCalculationService caseFeesService, PaymentCalculationService summonCalculationService) {
        this.caseFeesService = caseFeesService;
        this.summonCalculationService = summonCalculationService;
    }

    @PostMapping(value = "/v1/_calculate")
    public ResponseEntity<CalculationRes> calculateTaskPayment(@Parameter(in = ParameterIn.DEFAULT, description = "", required = true, schema = @Schema()) @Valid @RequestBody TaskPaymentRequest request) {
        log.info("api = /v1/_calculate, result=IN_PROGRESS ");
        List<Calculation> calculations = summonCalculationService.calculateTaskPaymentFees(request);
        CalculationRes response = CalculationRes.builder().responseInfo(ResponseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true)).calculation(calculations).build();
        log.info("api = /v1/_calculate, result=SUCCESS");
        return new ResponseEntity<>(response, HttpStatus.OK);

    }

    @PostMapping(value = "/v1/case/fees/_calculate")
    public ResponseEntity<CalculationRes> caseFeesCalculation(@Parameter(in = ParameterIn.DEFAULT, description = "", required = true, schema = @Schema()) @Valid @RequestBody EFillingCalculationReq body) {
        log.info("api = /v1/case/fees/_calculate, result=IN_PROGRESS ");
        List<Calculation> calculations = caseFeesService.calculateCaseFees(body);
        CalculationRes response = CalculationRes.builder().responseInfo(ResponseInfoFactory.createResponseInfoFromRequestInfo(body.getRequestInfo(), true)).calculation(calculations).build();
        log.info("api = /v1/case/fees/_calculate, result=SUCCESS");
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
