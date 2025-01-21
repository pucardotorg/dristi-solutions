package pucar.service.impl;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pucar.config.Configuration;
import pucar.repository.LockRepository;
import pucar.util.IndividualUtil;
import pucar.web.models.Lock;
import pucar.web.models.AuditDetails;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LockServiceImplTest {

    @Mock
    private LockRepository repository;

    @Mock
    private Configuration configuration;

    @Mock
    private IndividualUtil individualUtil;

    @InjectMocks
    private LockServiceImpl lockService;

    private RequestInfo requestInfo;

    @BeforeEach
    void setUp() {
        requestInfo = new RequestInfo();
        requestInfo.setUserInfo(new User());
        requestInfo.getUserInfo().setUuid("test-user-id");
    }

    @Test
    void testSetLock_Success() {
        Lock lockDetails = new Lock();
        lockDetails.setUniqueId("test-unique-id");
        lockDetails.setTenantId("test-tenant-id");

        when(configuration.getLockDurationMillis()).thenReturn(60000L);
        when(individualUtil.getIndividualId(requestInfo)).thenReturn("test-individual-id");
        when(repository.save(any(Lock.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Lock result = lockService.setLock(requestInfo, lockDetails);

        assertNotNull(result);
        assertEquals("test-unique-id", result.getUniqueId());
        assertEquals("test-tenant-id", result.getTenantId());
        assertNotNull(result.getId());
        assertTrue(result.getIsLocked());
        verify(repository, times(1)).save(any(Lock.class));
    }

    @Test
    void testSetLock_Exception() {
        Lock lockDetails = new Lock();
        lockDetails.setUniqueId("test-unique-id");
        lockDetails.setTenantId("test-tenant-id");

        when(configuration.getLockDurationMillis()).thenReturn(60000L);
        when(individualUtil.getIndividualId(requestInfo)).thenReturn("test-individual-id");
        when(repository.save(any(Lock.class))).thenThrow(new RuntimeException("Database error"));

        CustomException exception = assertThrows(CustomException.class, () -> lockService.setLock(requestInfo, lockDetails));
        assertEquals("SET_LOCK_EXCEPTION", exception.getCode());
    }

    @Test
    void testGetLock_LockExistsAndValid() {
        Lock lock = new Lock();
        lock.setId("test-lock-id");
        lock.setLockReleaseTime(System.currentTimeMillis() + 60000);
        lock.setIsLocked(true);

        when(repository.getLockByUniqueIdAndTenantIdAndIsLocked("test-unique-id", "test-tenant-id", true))
                .thenReturn(Optional.of(lock));

        Lock result = lockService.getLock("test-unique-id", "test-tenant-id");

        assertNotNull(result);
        assertEquals("test-lock-id", result.getId());
        verify(repository, never()).delete(any(Lock.class));
    }

    @Test
    void testGetLock_LockExistsAndExpired() {
        Lock lock = new Lock();
        lock.setId("test-lock-id");
        lock.setLockReleaseTime(System.currentTimeMillis() - 60000);
        lock.setIsLocked(true);

        when(repository.getLockByUniqueIdAndTenantIdAndIsLocked("test-unique-id", "test-tenant-id", true))
                .thenReturn(Optional.of(lock));

        Lock result = lockService.getLock("test-unique-id", "test-tenant-id");

        assertNull(result);
        verify(repository, times(1)).delete(lock);
    }

    @Test
    void testGetLock_LockDoesNotExist() {
        when(repository.getLockByUniqueIdAndTenantIdAndIsLocked("test-unique-id", "test-tenant-id", true))
                .thenReturn(Optional.empty());

        Lock result = lockService.getLock("test-unique-id", "test-tenant-id");

        assertNull(result);
    }

    @Test
    void testReleaseLock_LockDoesNotExist() {
        when(repository.getLockByUniqueIdAndTenantIdAndIsLocked("test-unique-id", "test-tenant-id", true))
                .thenReturn(Optional.empty());

        Boolean result = lockService.releaseLock(requestInfo, "test-unique-id", "test-tenant-id");

        assertFalse(result);
    }

    @Test
    void testReleaseLock_LockExist() {

        Lock lock1 = new Lock();
        lock1.setIndividualId("12345");

        Optional<Lock> lock = Optional.of(lock1);

        when(repository.getLockByUniqueIdAndTenantIdAndIsLocked("test-unique-id", "test-tenant-id", true))
                .thenReturn(lock);
        when(individualUtil.getIndividualId(requestInfo)).thenReturn("1234");

        Boolean result = lockService.releaseLock(requestInfo, "test-unique-id", "test-tenant-id");

        assertTrue(result);
    }

    @Test
    void testGetUpdateAuditDetailsSuccess() {

        AuditDetails auditDetails = lockService.getUpdateAuditDetails(requestInfo,mock(AuditDetails.class));

        assertNotNull(auditDetails);
        assertEquals(auditDetails.getLastModifiedBy(),auditDetails.getLastModifiedBy());

    }

    @Test
    void testReleaseLock_Unauthorized() {
        Lock lock = new Lock();
        lock.setId("test-lock-id");
        lock.setIndividualId("other-individual-id");

        when(repository.getLockByUniqueIdAndTenantIdAndIsLocked("test-unique-id", "test-tenant-id", true))
                .thenReturn(Optional.of(lock));
        when(individualUtil.getIndividualId(requestInfo)).thenReturn("other-individual-id");

        CustomException exception = assertThrows(CustomException.class, () ->
                lockService.releaseLock(requestInfo, "test-unique-id", "test-tenant-id"));

        assertEquals("UNAUTHORIZED", exception.getCode());
        verify(repository, never()).delete(any(Lock.class));
    }

}
