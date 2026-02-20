package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.RequestInfoWrapper;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.web.models.lock.LockRequest;
import org.pucar.dristi.web.models.lock.LockResponse;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class LockService {

    private final Configuration config;
    private final ServiceRequestRepository serviceRequestRepository;
    private final ObjectMapper objectMapper;

    public LockService(Configuration config, ServiceRequestRepository serviceRequestRepository, ObjectMapper objectMapper) {
        this.config = config;
        this.serviceRequestRepository = serviceRequestRepository;
        this.objectMapper = objectMapper;
    }

    public LockResponse getLock(RequestInfoWrapper requestInfoWrapper, String uniqueId, String tenantId) {
        StringBuilder uri = new StringBuilder();
        uri.append(config.getLockHost()).append(config.getLockGetEndpoint());
        uri.append("?uniqueId=").append(uniqueId);
        uri.append("&tenantId=").append(tenantId);
        log.info("method=getLock, status=IN_PROGRESS, uniqueId={}, tenantId={}", uniqueId, tenantId);

        Object response = serviceRequestRepository.fetchResult(uri, requestInfoWrapper);
        log.info("method=getLock, status=SUCCESS, uniqueId={}, tenantId={}", uniqueId, tenantId);
        return objectMapper.convertValue(response, LockResponse.class);

    }

    public LockResponse setLock(LockRequest lockRequest) {
        StringBuilder uri = new StringBuilder();
        uri.append(config.getLockHost()).append(config.getLockSetEndpoint());
        log.info("method=setLock, status=IN_PROGRESS, request={}", lockRequest);

        Object response = serviceRequestRepository.fetchResult(uri, lockRequest);
        log.info("method=setLock, status=SUCCESS, uniqueId={}", lockRequest.getLock().getUniqueId());
        return objectMapper.convertValue(response, LockResponse.class);
    }

    public LockResponse releaseLock(RequestInfoWrapper requestInfoWrapper, String uniqueId, String tenantId) {
        StringBuilder uri = new StringBuilder();
        uri.append(config.getLockHost()).append(config.getLockReleaseEndpoint());
        uri.append("?uniqueId=").append(uniqueId);
        uri.append("&tenantId=").append(tenantId);
        log.info("method=releaseLock, status=IN_PROGRESS, uniqueId={}, tenantId={}", uniqueId, tenantId);

        Object response = serviceRequestRepository.fetchResult(uri, requestInfoWrapper);
        log.info("method=releaseLock, status=SUCCESS, uniqueId={}", uniqueId);
        return objectMapper.convertValue(response, LockResponse.class);

    }

}
