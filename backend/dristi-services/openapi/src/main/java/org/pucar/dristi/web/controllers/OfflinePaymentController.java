package org.pucar.dristi.web.controllers;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.pucar.dristi.service.OfflinePaymentService;
import org.pucar.dristi.util.RequestInfoGenerator;
import org.pucar.dristi.web.models.offline_payments.OfflinePaymentTaskRequest;
import org.pucar.dristi.web.models.offline_payments.OfflinePaymentTaskResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("openapi/offline-payment")
public class OfflinePaymentController {

    private final OfflinePaymentService offlinePaymentService;

    private final RequestInfoGenerator requestInfoGenerator;

    @Autowired
    public OfflinePaymentController(OfflinePaymentService offlinePaymentService, RequestInfoGenerator requestInfoGenerator) {
        this.offlinePaymentService = offlinePaymentService;
        this.requestInfoGenerator = requestInfoGenerator;
    }

    @PostMapping("/_create")
    public ResponseEntity<OfflinePaymentTaskResponse> createOfflinePayment(@RequestBody OfflinePaymentTaskRequest offlinePaymentRequest) {

        RequestInfo requestInfo = requestInfoGenerator.createInternalRequestInfo();
        offlinePaymentRequest.setRequestInfo(requestInfo);

        offlinePaymentService.createOfflinePayment(offlinePaymentRequest);
        return ResponseEntity.ok()
                .body(OfflinePaymentTaskResponse.builder()
                        .responseInfo(ResponseInfo.builder().build())
                        .offlinePaymentTask(offlinePaymentRequest.getOfflinePaymentTask())
                        .build());
    }

}
