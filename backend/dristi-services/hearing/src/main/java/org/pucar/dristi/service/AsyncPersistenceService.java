package org.pucar.dristi.service;

import lombok.extern.slf4j.Slf4j;
import org.pucar.dristi.web.models.HearingRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class AsyncPersistenceService {

    private final HearingService hearingService;

    @Autowired
    public AsyncPersistenceService(@Lazy HearingService hearingService) {
        this.hearingService = hearingService;
    }

    @Async("hearingAsyncExecutor")
    public void persistStatusChange(HearingRequest hearingRequest) {
        String hearingId = hearingRequest.getHearing() != null ? hearingRequest.getHearing().getHearingId() : "unknown";
        log.info("operation=persistStatusChange, status=IN_PROGRESS, hearingId={}", hearingId);
        try {
            hearingService.performPersistStatusChange(hearingRequest);
            log.info("operation=persistStatusChange, status=COMPLETED, hearingId={}", hearingId);
        } catch (Exception e) {
            log.error("operation=persistStatusChange, status=FAILURE, hearingId={}", hearingId, e);
        }
    }
}
