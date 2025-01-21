package pucar.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import pucar.config.Configuration;
import pucar.repository.LockRepository;
import pucar.service.LockService;
import pucar.util.IndividualUtil;
import pucar.web.models.AuditDetails;
import pucar.web.models.Lock;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class LockServiceImpl implements LockService {

    private final LockRepository repository;
    private final Configuration configuration;
    private final IndividualUtil individualUtil;

    @Autowired
    public LockServiceImpl(LockRepository repository, Configuration configuration, IndividualUtil individualUtil) {
        this.repository = repository;
        this.configuration = configuration;
        this.individualUtil = individualUtil;
    }

    @Override
    public Lock setLock(RequestInfo requestInfo, Lock lockDetails) {

        log.info("method:setLock, result=InProgress, uniqueId={},tenantId={}", lockDetails.getUniqueId(), lockDetails.getTenantId());

        lockDetails.setId(UUID.randomUUID().toString());
        lockDetails.setLockReleaseTime(System.currentTimeMillis() + configuration.getLockDurationMillis());
        lockDetails.setLockDate(System.currentTimeMillis());
        String individualId = individualUtil.getIndividualId(requestInfo);
        lockDetails.setIndividualId(individualId);
        lockDetails.setIsLocked(true);
        lockDetails.setAuditDetails(getCreateAuditDetails(requestInfo));
        Lock lockedResponse = null;
        try {
            lockedResponse = repository.save(lockDetails);

        } catch (Exception e) {
            log.error("Method:setLock, Result=Error, uniqueId={},tenantId={}", lockDetails.getUniqueId(), lockDetails.getTenantId());
            log.error("Error:", e);
            throw new CustomException("SET_LOCK_EXCEPTION", "Error occurred while creating a lock");
        }
        log.info("Method:setLock, Result=success, uniqueId={},tenantId={}", lockDetails.getUniqueId(), lockDetails.getTenantId());
        return lockedResponse;
    }

    @Override
    public Lock getLock(String uniqueId, String tenantId) {
        log.info("method:getLock, result=InProgress, uniqueId={},tenantId={}", uniqueId, tenantId);

        Optional<Lock> lock = repository.getLockByUniqueIdAndTenantIdAndIsLocked(uniqueId, tenantId, true);

        if (lock.isPresent()) {

            Lock existingLock = lock.get();
            log.info("method:getLock, result=InProgress, lockId={}", existingLock.getId());

            Long expiryTime = existingLock.getLockReleaseTime(); // Assuming Lock has getExpiryTime() method returning long
            Long currentTime = System.currentTimeMillis();

            if (expiryTime < currentTime) {
                log.info("method:getLock, result=InProgress, lock is expired, removing lock with lockId={}", existingLock.getId());

                // Lock is expired, delete it
                repository.delete(existingLock);
                log.info("method:getLock, result=success");

                return null;
            } else {
                // Lock is still valid, return lock details
                log.info("method:getLock, result=success, return lock with id={}", lock.get().getId());

                return lock.get();
            }
        }

        return null;
    }

    @Override
    public Boolean releaseLock(RequestInfo requestInfo, String uniqueId, String tenantId) {
        log.info("method:releaseLock, result=inProgress , uniqueId={}, tenantId={}", uniqueId, tenantId);

        Optional<Lock> existingLock = repository.getLockByUniqueIdAndTenantIdAndIsLocked(uniqueId, tenantId, true);
        if (existingLock.isEmpty()) {

            log.info("method:releaseLock, result=success ,lock does not exist return false");
            return false;

        } else {

            Lock lock = existingLock.get();
            log.info("method:releaseLock, result=inProgress ,lock exist with lockId={}", lock.getId());

            String individualId = individualUtil.getIndividualId(requestInfo);
            if (!lock.getIndividualId().equals(individualId)) {

                log.error("method:releaseLock, result=error ,lockId={}", lock.getId());
                throw new CustomException("UNAUTHORIZED", "You are not allowed to release this lock.");
            }
            // releasing the lock
            repository.delete(lock);
            log.info("method:releaseLock, result=success ,successfully released the lock");

            return true;

        }

    }


    AuditDetails getCreateAuditDetails(RequestInfo requestInfo) {
        return AuditDetails.builder()
                .createdBy(requestInfo.getUserInfo().getUuid())
                .createdTime(System.currentTimeMillis())
                .lastModifiedBy(requestInfo.getUserInfo().getUuid())
                .lastModifiedTime(System.currentTimeMillis()).build();
    }

    AuditDetails getUpdateAuditDetails(RequestInfo requestInfo, AuditDetails auditDetails) {
        auditDetails.setLastModifiedBy(requestInfo.getUserInfo().getUuid());
        auditDetails.setLastModifiedTime(System.currentTimeMillis());
        return auditDetails;
    }
}
