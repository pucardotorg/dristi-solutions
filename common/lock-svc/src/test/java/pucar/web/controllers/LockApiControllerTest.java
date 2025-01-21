package pucar.web.controllers;

import org.egov.common.contract.models.RequestInfoWrapper;
import org.egov.common.contract.request.RequestInfo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import pucar.service.LockService;
import pucar.web.models.Lock;
import pucar.web.models.LockRequest;
import pucar.web.models.LockResponse;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LockApiControllerTest {

    @Mock
    private LockService lockService;

    @InjectMocks
    private LockApiController lockApiController;

    @Test
    void testSearchLock() {
        // Arrange
        RequestInfoWrapper requestInfoWrapper = new RequestInfoWrapper();
        RequestInfo requestInfo = new RequestInfo();
        requestInfoWrapper.setRequestInfo(requestInfo);
        String uniqueId = "testUniqueId";
        String tenantId = "testTenantId";

        Lock lock = new Lock();
        when(lockService.getLock(uniqueId, tenantId)).thenReturn(lock);

        // Act
        ResponseEntity<LockResponse> response = lockApiController.searchLock(requestInfoWrapper, uniqueId, tenantId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(lock, response.getBody().getLock());
        verify(lockService, times(1)).getLock(uniqueId, tenantId);
    }

    @Test
    void testSetLock() {
        // Arrange
        LockRequest lockRequest = new LockRequest();
        RequestInfo requestInfo = new RequestInfo();
        Lock lock = new Lock();
        lockRequest.setRequestInfo(requestInfo);
        lockRequest.setLock(lock);

        Lock savedLock = new Lock();
        when(lockService.setLock(requestInfo, lock)).thenReturn(savedLock);

        // Act
        ResponseEntity<LockResponse> response = lockApiController.setLock(lockRequest);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(savedLock, response.getBody().getLock());
        verify(lockService, times(1)).setLock(requestInfo, lock);
    }

    @Test
    void testReleaseLock() {
        // Arrange
        RequestInfoWrapper requestInfoWrapper = new RequestInfoWrapper();
        RequestInfo requestInfo = new RequestInfo();
        requestInfoWrapper.setRequestInfo(requestInfo);
        String uniqueId = "testUniqueId";
        String tenantId = "testTenantId";

        when(lockService.releaseLock(requestInfo, uniqueId, tenantId)).thenReturn(true);

        // Act
        ResponseEntity<?> response = lockApiController.releaseLock(requestInfoWrapper, uniqueId, tenantId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(lockService, times(1)).releaseLock(requestInfo, uniqueId, tenantId);
    }
}
