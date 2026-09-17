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

    private static final int MAX_ATTEMPTS = 3;
    private static final long BACKOFF_MS = 500;

    @Async("hearingAsyncExecutor")
    public void persistStatusChange(HearingRequest hearingRequest) {
        String hearingId = hearingRequest.getHearing() != null ? hearingRequest.getHearing().getHearingId() : "unknown";
        log.info("operation=persistStatusChange, status=IN_PROGRESS, hearingId={}", hearingId);
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                hearingService.performPersistStatusChange(hearingRequest);
                log.info("operation=persistStatusChange, status=COMPLETED, hearingId={}, attempt={}", hearingId, attempt);
                return;
            } catch (Exception e) {
                if (attempt < MAX_ATTEMPTS) {
                    log.warn("operation=persistStatusChange, status=RETRY, hearingId={}, attempt={}/{}", hearingId, attempt, MAX_ATTEMPTS, e);
                    try {
                        Thread.sleep(BACKOFF_MS * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        log.error("CACHE_DB_INCONSISTENCY operation=persistStatusChange, status=INTERRUPTED, hearingId={}", hearingId, ie);
                        return;
                    }
                } else {
                    log.error("CACHE_DB_INCONSISTENCY operation=persistStatusChange, status=ALL_ATTEMPTS_FAILED, hearingId={}, attempts={}", hearingId, MAX_ATTEMPTS, e);
                }
            }
        }
    }
}
