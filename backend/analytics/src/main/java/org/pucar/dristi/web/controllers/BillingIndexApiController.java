package org.pucar.dristi.web.controllers;

import jakarta.validation.Valid;
import org.pucar.dristi.service.BillingService;
import org.pucar.dristi.web.models.OfflinePaymentTaskRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("")
public class BillingIndexApiController {

    private final BillingService billingService;

    @Autowired
    public BillingIndexApiController(BillingService billingService) {
        this.billingService = billingService;
    }

    @PostMapping("/offline-payment")
    public void processOfflinePayment(@Valid @RequestBody OfflinePaymentTaskRequest offlinePaymentTaskRequest) {
        billingService.processOfflinePayment(offlinePaymentTaskRequest);
    }



}
