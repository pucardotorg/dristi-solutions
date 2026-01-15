package org.pucar.dristi.enrichment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.util.CaseUtil;
import org.pucar.dristi.util.IdgenUtil;
import org.pucar.dristi.web.models.Application;
import org.pucar.dristi.web.models.ApplicationRequest;
import org.pucar.dristi.web.models.Document;
import org.pucar.dristi.web.models.StatuteSection;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.pucar.dristi.config.ServiceConstants.ENRICHMENT_EXCEPTION;

@ExtendWith(MockitoExtension.class)
class ApplicationEnrichmentTest {

    @Mock
    private IdgenUtil idgenUtil;

    @Mock
    private CaseUtil caseUtil;

    @Mock
    private Configuration configuration;

    @InjectMocks
    private ApplicationEnrichment applicationEnrichment;

    private ApplicationRequest applicationRequest;

    @BeforeEach
    void setUp() {
        User userInfo = User.builder().uuid("user-uuid").tenantId("tenant-id").build();
        RequestInfo requestInfo = RequestInfo.builder().userInfo(userInfo).build();
        Application application = Application.builder()
                .statuteSection(new StatuteSection())
                .filingNumber("KL-123")
                .documents(Collections.singletonList(new Document()))
                .build();
        applicationRequest = ApplicationRequest.builder()
                .requestInfo(requestInfo)
                .application(application)
                .build();
    }

    @Test
    void enrichApplication() {
        // Mock UUIDs and timestamps
        UUID mockUuid = UUID.randomUUID();
        long now = System.currentTimeMillis();

        // Prepare mock request info and user info
        User userInfo = new User();
        userInfo.setUuid(mockUuid.toString());
        RequestInfo requestInfo = new RequestInfo();
        requestInfo.setUserInfo(userInfo);

        // Prepare statute section
        StatuteSection statuteSection = new StatuteSection();

        // Prepare documents
        Document doc1 = new Document();
        Document doc2 = new Document();
        List<Document> documentList = List.of(doc1, doc2);

        // Prepare application
        Application application = new Application();
        application.setFilingNumber("KL-123");
        application.setStatuteSection(statuteSection);
        application.setDocuments(documentList);

        // Prepare ApplicationRequest
        applicationRequest = new ApplicationRequest();
        applicationRequest.setRequestInfo(requestInfo);
        applicationRequest.setApplication(application);

        // Mock IDGEN return
        when(idgenUtil.getIdList(any(), any(), any(), any(), anyInt(), any()))
                .thenReturn(Collections.singletonList("CMP123"));

        // Mock config values
        when(configuration.getApplicationConfig()).thenReturn("config");
        when(configuration.getApplicationFormat()).thenReturn("format");

        // Mock CaseUtil return for courtId
        ObjectMapper mapper = new ObjectMapper();
        JsonNode courtNode = mapper.valueToTree(Collections.singletonMap("courtId", "COURT123"));
        when(caseUtil.searchCaseDetails(any())).thenReturn(courtNode);

        // Call method under test
        applicationEnrichment.enrichApplication(applicationRequest);

        // Validate
        Application enrichedApp = applicationRequest.getApplication();
        assertEquals("KL-123-CMP123", enrichedApp.getApplicationNumber());
        assertNotNull(enrichedApp.getId());
        assertNotNull(enrichedApp.getCreatedDate());
        assertNotNull(enrichedApp.getAuditDetails());
        assertEquals(mockUuid.toString(), enrichedApp.getAuditDetails().getCreatedBy());
        assertTrue(enrichedApp.getIsActive());

        assertEquals("COURT123", enrichedApp.getCourtId());

        assertNotNull(enrichedApp.getStatuteSection().getId());
        assertNotNull(enrichedApp.getStatuteSection().getAuditdetails());

        enrichedApp.getDocuments().forEach(doc -> assertNotNull(doc.getId()));

        verify(idgenUtil, times(1)).getIdList(any(), any(), any(), any(), anyInt(), any());
        verify(caseUtil, times(1)).searchCaseDetails(any());
    }


    @Test
    void enrichApplicationUponUpdate() {
        AuditDetails auditDetails = AuditDetails.builder()
                .createdBy("user-uuid")
                .createdTime(System.currentTimeMillis() - 1000)
                .lastModifiedBy("user-uuid")
                .lastModifiedTime(System.currentTimeMillis() - 1000)
                .build();
        Application application = applicationRequest.getApplication();
        application.setAuditDetails(auditDetails);

        applicationEnrichment.enrichApplicationUponUpdate(applicationRequest);

        assertEquals("user-uuid", application.getAuditDetails().getLastModifiedBy());
        assertTrue(application.getAuditDetails().getLastModifiedTime() > auditDetails.getCreatedTime());
    }
    @Test
    public void testEnrichApplicationUponUpdateFailure() {
        ApplicationRequest request = new ApplicationRequest();

        CustomException customException = assertThrows(CustomException.class, () -> {
            applicationEnrichment.enrichApplicationUponUpdate(request);
        });
        assertEquals(ENRICHMENT_EXCEPTION, customException.getCode());

    }
}
