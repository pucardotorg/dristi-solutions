package org.egov.eTreasury.scheduler;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.eTreasury.model.AuthSek;
import org.egov.eTreasury.model.VerificationData;
import org.egov.eTreasury.model.VerificationDetails;
import org.egov.eTreasury.repository.AuthSekRepository;
import org.egov.eTreasury.service.PaymentService;
import org.egov.eTreasury.config.PaymentConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
public class PaymentReconciliationScheduler {

    private final AuthSekRepository authSekRepository;
    private final PaymentService paymentService;
    private final PaymentConfiguration config;

    @Autowired
    public PaymentReconciliationScheduler(AuthSekRepository authSekRepository, PaymentService paymentService, PaymentConfiguration config) {
        this.authSekRepository = authSekRepository;
        this.paymentService = paymentService;
        this.config = config;
    }

    // Run at configured schedule to reconcile pending payments
    @Scheduled(cron = "${payment.reconciliation.cron}")
    public void reconcilePendingPayments() {
        log.info("Starting automated payment reconciliation via Cron Job");
        
        // Target: pending for configured hours (clearing stalled payments within 24 hours per requirements)
        long thresholdHours = config.getReconciliationThresholdHours();
        long thresholdTime = System.currentTimeMillis() - (thresholdHours * 60L * 60L * 1000L);
        log.info("Reconciling payments pending for more than {} hours", thresholdHours); 
        
        List<AuthSek> pendingPayments = authSekRepository.getPendingAuthSeks(thresholdTime);
        log.info("Found {} pending payments to reconcile", pendingPayments.size());

        RequestInfo requestInfo = createSystemRequestInfo();

        for (AuthSek authSek : pendingPayments) {
            try {
                log.info("Reconciling payment for billId: {}", authSek.getBillId());
                
                VerificationDetails details = new VerificationDetails();
                details.setDepartmentId(authSek.getDepartmentId());
                details.setAmount(authSek.getTotalDue());
                details.setOfficeCode(config.getOfficeCode());
                details.setServiceDeptCode(config.getServiceDeptCode());

                VerificationData verificationData = new VerificationData();
                verificationData.setVerificationDetails(details);
                verificationData.setBillId(authSek.getBillId());
                verificationData.setBusinessService(authSek.getBusinessService());
                verificationData.setServiceNumber(authSek.getServiceNumber());
                verificationData.setTotalDue(authSek.getTotalDue());
                verificationData.setMobileNumber(authSek.getMobileNumber());
                verificationData.setPaidBy(authSek.getPaidBy());

                paymentService.doubleVerifyPayment(verificationData, requestInfo);
                
                log.info("Successfully reconciled payment for billId: {}", authSek.getBillId());
            } catch (Exception e) {
                log.error("Error reconciling payment for billId: {}. Error: {}", authSek.getBillId(), e.getMessage(), e);
            }
        }
        
        log.info("Completed automated payment reconciliation Cron Job");
    }

    private RequestInfo createSystemRequestInfo() {
        RequestInfo requestInfo = new RequestInfo();
        User userInfo = new User();
        userInfo.setUuid("SYSTEM");
        userInfo.setName("SYSTEM");
        userInfo.setTenantId(config.getEgovStateTenantId());
        requestInfo.setUserInfo(userInfo);
        return requestInfo;
    }
}
