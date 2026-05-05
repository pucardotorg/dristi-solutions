package org.pucar.dristi.service;

import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.pucar.dristi.util.OfflinePaymentUtil;
import org.pucar.dristi.web.models.offline_payments.OfflinePaymentTaskRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class OfflinePaymentService {

    private final OfflinePaymentUtil offlinePaymentUtil;

    @Autowired
    public OfflinePaymentService(OfflinePaymentUtil offlinePaymentUtil) {
        this.offlinePaymentUtil = offlinePaymentUtil;
    }

    public void createOfflinePayment(OfflinePaymentTaskRequest offlinePaymentTaskRequest) {

        try {
            offlinePaymentUtil.callOfflinePaymentAPI(offlinePaymentTaskRequest);
        } catch (Exception e) {
            log.error("Error while calling offline payment API", e);
            throw new CustomException("Error while calling offline payment API", e.getMessage());
        }

    }

}
