package org.pucar.dristi.web.controllers;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.pucar.dristi.service.PaymentService;
import org.pucar.dristi.util.RequestInfoGenerator;
import org.pucar.dristi.util.ResponseInfoFactory;
import org.pucar.dristi.web.models.payment.BillResponseV2;
import org.pucar.dristi.web.models.payment.CalculationRes;
import org.pucar.dristi.web.models.payment.ChallanRequest;
import org.pucar.dristi.web.models.payment.FetchBillRequest;
import org.pucar.dristi.web.models.payment.HtmlResponse;
import org.pucar.dristi.web.models.payment.PrintResponse;
import org.pucar.dristi.web.models.payment.SearchBillRequest;
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
    private final RequestInfoGenerator requestInfoGenerator;

    public PaymentController(PaymentService paymentService, ResponseInfoFactory responseInfoFactory, RequestInfoGenerator requestInfoGenerator) {
        this.paymentService = paymentService;
        this.responseInfoFactory = responseInfoFactory;
        this.requestInfoGenerator = requestInfoGenerator;
    }

    @PostMapping("/v1/_fetchbill")
    public ResponseEntity<BillResponseV2> fetchBill(@RequestBody FetchBillRequest request) {
        log.info("api=/v1/_fetchbill, status=IN_PROGRESS, request={}", request);

        RequestInfo requestInfo = requestInfoGenerator.createInternalRequestInfo();
        request.setRequestInfo(requestInfo);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);
        BillResponseV2 response = paymentService.fetchBill(request);
        response.setResposneInfo(responseInfo);

        log.info("api=/v1/_fetchbill, status=SUCCESS");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/v1/_searchbill")
    public ResponseEntity<BillResponseV2> searchBill(@RequestBody SearchBillRequest request) {

        log.info("api=/v1/searchbill, status=IN_PROGRESS, request={}", request);

        RequestInfo requestInfo = requestInfoGenerator.createInternalRequestInfo();
        request.setRequestInfo(requestInfo);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);
        BillResponseV2 response = paymentService.searchBill(request);
        response.setResposneInfo(responseInfo);

        log.info("api=/v1/searchbill, status=SUCCESS");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/v1/_getHeadBreakDown")
    public ResponseEntity<TreasuryMappingResponse> getHeadBreakDown(@RequestParam String consumerCode, @RequestBody RequestInfo requestInfo) {

        log.info("api=/v1/_getHeadBreakdown, status=IN_PROGRESS, consumerCode={}", consumerCode);

        requestInfo = requestInfoGenerator.createInternalRequestInfo();
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);
        TreasuryMappingResponse response = paymentService.getHeadBreakDown(consumerCode, requestInfo);
        response.setResponseInfo(responseInfo);

        log.info("api=/v1/_getHeadBreakdown, status=SUCCESS");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/v1/_processChallan")
    public ResponseEntity<HtmlResponse> processPayment(@RequestBody ChallanRequest request) {

        log.info("api=/v1/_processChallan, status=IN_PROGRESS, request={}", request);

        RequestInfo requestInfo = requestInfoGenerator.createInternalRequestInfo();
        request.setRequestInfo(requestInfo);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);
        HtmlResponse response = paymentService.processChallan(request);
        response.setResponseInfo(responseInfo);

        log.info("api=/v1/_processChallan, status=SUCCESS");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/v1/_calculate")
    public ResponseEntity<CalculationRes> calculatePayment(@RequestBody TaskPaymentRequest request) {

        log.info("api=/v1/_calculate, status=IN_PROGRESS, request={}", request);

        RequestInfo requestInfo = requestInfoGenerator.createInternalRequestInfo();
        request.setRequestInfo(requestInfo);
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);
        CalculationRes response = paymentService.calculatePayment(request);
        response.setResponseInfo(responseInfo);

        log.info("api=/v1/_calculate, status=SUCCESS");

        return ResponseEntity.ok(response);
    }

    @PostMapping("/v1/getPaymentReceipt")
    public ResponseEntity<PrintResponse> getPaymentReceipt(@RequestParam String billId, @RequestBody RequestInfo requestInfo){
        log.info("api=/v1/getPaymentReceipt, status=IN_PROGRESS, billId={}", billId);

        requestInfo = requestInfoGenerator.createInternalRequestInfo();
        ResponseInfo responseInfo = responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true);
        PrintResponse response = paymentService.getPaymentReceipt(billId, requestInfo);
        response.setResponseInfo(responseInfo);

        log.info("api=/v1/getPaymentReceipt, status=SUCCESS");

        return ResponseEntity.ok(response);
    }


}
