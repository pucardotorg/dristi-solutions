package org.pucar.dristi.util;

import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.offline_payments.OfflinePaymentTaskRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class OfflinePaymentUtil {

    private final Configuration configuration;
    private final ServiceRequestRepository repository;

    @Autowired
    public OfflinePaymentUtil(Configuration configuration, ServiceRequestRepository repository) {
        this.configuration = configuration;
        this.repository = repository;
    }

    /**
     * Calls the offline payment API to process the offline payment task
     *
     * @param offlinePaymentTaskRequest The request containing offline payment task details
     */
    public void callOfflinePaymentAPI(OfflinePaymentTaskRequest offlinePaymentTaskRequest) {
        // Build the URL
        StringBuilder url = new StringBuilder()
                .append(configuration.getAnalyticsHost())
                .append(configuration.getOfflinePaymentEndPoint());

        log.info("Calling offline payment API at: {}", url);

        // Call the API
        Object response = repository.fetchResult(url, offlinePaymentTaskRequest);
        log.info("Offline payment API response: {}", response);
    }
}
