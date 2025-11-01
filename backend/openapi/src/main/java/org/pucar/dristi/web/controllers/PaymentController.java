package org.pucar.dristi.web.controllers;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.pucar.dristi.service.PaymentService;
import org.pucar.dristi.util.ResponseInfoFactory;
import org.pucar.dristi.web.models.payment.BillResponseV2;
import org.pucar.dristi.web.models.payment.CalculationRes;
import org.pucar.dristi.web.models.payment.ChallanRequest;
import org.pucar.dristi.web.models.payment.FetchBillRequest;
import org.pucar.dristi.web.models.payment.HtmlResponse;
import org.pucar.dristi.web.models.payment.TaskPaymentRequest;
import org.pucar.dristi.web.models.payment.TreasuryMappingResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/openapi/payment")
@Slf4j
public class PaymentController {
    private final PaymentService paymentService;
    private final ResponseInfoFactory responseInfoFactory;

    public PaymentController(PaymentService paymentService, ResponseInfoFactory responseInfoFactory) {
        this.paymentService = paymentService;
        this.responseInfoFactory = responseInfoFactory;
    }

    @PostMapping("/v1/_fetchbill")
    public ResponseEntity<BillResponseV2> fetchBill(@RequestBody FetchBillRequest request) {

        log.info("api=/v1/_fetchbill, status=IN_PROGRESS, request={}", request);

        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true);
        BillResponseV2 response = paymentService.fetchBill(request);
        response.setResposneInfo(responseInfo);

        log.info("api=/v1/_fetchbill, status=SUCCESS");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/v1/_getHeadBreakDown")
    public ResponseEntity<TreasuryMappingResponse> getHeadBreakDown(@RequestParam String consumerCode, @RequestBody RequestInfo requestInfo) {

        log.info("api=/v1/_getHeadBreakdown, status=IN_PROGRESS, consumerCode={}", consumerCode);

        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);
        TreasuryMappingResponse response = paymentService.getHeadBreakDown(consumerCode, requestInfo);
        response.setResponseInfo(responseInfo);

        log.info("api=/v1/_getHeadBreakdown, status=SUCCESS");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/v1/_processChallan")
    public ResponseEntity<HtmlResponse> processPayment(@RequestBody ChallanRequest request) {

        log.info("api=/v1/_processChallan, status=IN_PROGRESS, request={}", request);

        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true);
        HtmlResponse response = paymentService.processChallan(request);
        response.setResponseInfo(responseInfo);

        log.info("api=/v1/_processChallan, status=SUCCESS");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/v1/_calculate")
    public ResponseEntity<CalculationRes> calculatePayment(@RequestBody TaskPaymentRequest request) {

        log.info("api=/v1/_calculate, status=IN_PROGRESS, request={}", request);

        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true);
        CalculationRes response = paymentService.calculatePayment(request);
        response.setResponseInfo(responseInfo);

        log.info("api=/v1/_calculate, status=SUCCESS");

        return ResponseEntity.ok(response);
    }


}
