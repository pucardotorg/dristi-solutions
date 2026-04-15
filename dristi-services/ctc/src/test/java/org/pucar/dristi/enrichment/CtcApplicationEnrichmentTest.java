package org.pucar.dristi.enrichment;

import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.util.IdgenUtil;
import org.pucar.dristi.web.models.CtcApplication;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CtcApplicationEnrichmentTest {

    @Mock private Configuration config;
    @Mock private IdgenUtil idgenUtil;

    @InjectMocks
    private CtcApplicationEnrichment enrichment;

    private RequestInfo requestInfo;
    private CtcApplication application;

    @BeforeEach
    void setUp() {
        requestInfo = RequestInfo.builder()
                .userInfo(User.builder().uuid("user-uuid-1").build())
                .build();

        application = CtcApplication.builder()
                .tenantId("pb")
                .build();

        lenient().when(config.getCaConfig()).thenReturn("ctc.ca.number");
        lenient().when(config.getCaFormat()).thenReturn("CA-[SEQ]");
        lenient().when(config.getZoneId()).thenReturn("Asia/Kolkata");
    }

    @Test
    void enrichOnCreateCtcApplication_shouldSetApplicationNumberIdAndAuditDetails() {
        when(idgenUtil.getIdList(eq(requestInfo), anyString(), anyString(), anyString(), eq(1), eq(false)))
                .thenReturn(List.of("CA-001"));

        enrichment.enrichOnCreateCtcApplication(requestInfo, application);

        assertTrue(application.getCtcApplicationNumber().startsWith("CA-001/"));
        assertNotNull(application.getId());
        assertNotNull(application.getAuditDetails());
        assertEquals("user-uuid-1", application.getAuditDetails().getCreatedBy());
        assertEquals("user-uuid-1", application.getAuditDetails().getLastModifiedBy());
        assertNotNull(application.getAuditDetails().getCreatedTime());
        assertNotNull(application.getAuditDetails().getLastModifiedTime());
    }

    @Test
    void enrichOnCreateCtcApplication_shouldThrowOnIdgenFailure() {
        when(idgenUtil.getIdList(eq(requestInfo), anyString(), anyString(), anyString(), eq(1), eq(false)))
                .thenThrow(new RuntimeException("idgen down"));

        assertThrows(CustomException.class, () -> enrichment.enrichOnCreateCtcApplication(requestInfo, application));
    }

    @Test
    void enrichOnUpdateCtcApplication_shouldUpdateLastModifiedFields() {
        AuditDetails auditDetails = AuditDetails.builder()
                .createdBy("user-uuid-1").createdTime(1000L)
                .lastModifiedBy("old-user").lastModifiedTime(1000L)
                .build();
        application.setAuditDetails(auditDetails);

        enrichment.enrichOnUpdateCtcApplication(requestInfo, application);

        assertEquals("user-uuid-1", application.getAuditDetails().getLastModifiedBy());
        assertTrue(application.getAuditDetails().getLastModifiedTime() > 1000L);
        // createdBy should not change
        assertEquals("user-uuid-1", application.getAuditDetails().getCreatedBy());
        assertEquals(1000L, application.getAuditDetails().getCreatedTime());
    }

    @Test
    void enrichOnUpdateCtcApplication_shouldHandleNullAuditDetails() {
        application.setAuditDetails(null);

        // Should not throw
        assertDoesNotThrow(() -> enrichment.enrichOnUpdateCtcApplication(requestInfo, application));
        assertNull(application.getAuditDetails());
    }

    @Test
    void enrichAuditDetailsOnCreate_shouldSetAllFields() {
        enrichment.enrichAuditDetailsOnCreate(requestInfo, application);

        AuditDetails audit = application.getAuditDetails();
        assertNotNull(audit);
        assertEquals("user-uuid-1", audit.getCreatedBy());
        assertEquals("user-uuid-1", audit.getLastModifiedBy());
        assertTrue(audit.getCreatedTime() > 0);
        assertEquals(audit.getCreatedTime(), audit.getLastModifiedTime());
    }

    @Test
    void getRandomUuid_shouldReturnNonNull() {
        assertNotNull(enrichment.getRandomUuid());
    }

    @Test
    void getRandomUuid_shouldReturnUniqueValues() {
        assertNotEquals(enrichment.getRandomUuid(), enrichment.getRandomUuid());
    }
}
