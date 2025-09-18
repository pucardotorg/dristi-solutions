package org.pucar.dristi.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.pucar.dristi.config.Configuration;
import org.pucar.dristi.repository.ServiceRequestRepository;
import org.pucar.dristi.util.AdvocateUtil;
import org.pucar.dristi.util.DateUtil;
import org.pucar.dristi.util.ResponseInfoFactory;
import org.pucar.dristi.web.models.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import org.pucar.dristi.util.InboxUtil;
import org.pucar.dristi.web.models.inbox.InboxRequest;
import org.pucar.dristi.web.models.inbox.OrderBy;
import org.pucar.dristi.web.models.inbox.ProcessInstanceSearchCriteria;

@ExtendWith(MockitoExtension.class)
public class OpenApiServiceTest {

    @Mock
    private Configuration configuration;

    @Mock
    private ServiceRequestRepository serviceRequestRepository;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private DateUtil dateUtil;

    @InjectMocks
    private OpenApiService openApiService;

    private CaseSummaryResponse mockCaseSummaryResponse;

    @Mock
    private InboxUtil inboxUtil;

    @Mock
    private AdvocateUtil advocateUtil;

    @Mock
    private ResponseInfoFactory responseInfoFactory;

    private static final String TENANT_ID = "tenant-1";

    @BeforeEach
    public void setup() {
        // Setup mock case summary
        CaseSummary mockCaseSummary = new CaseSummary();
        mockCaseSummary.setFilingNumber("TEST-FILING-001");

        mockCaseSummaryResponse = new CaseSummaryResponse();
        mockCaseSummaryResponse.setCaseSummary(mockCaseSummary);
    }

    @Test
    public void testGetCaseByCnrNumber_ElasticSearchDisabled() {
        // Arrange
        String tenantId = "TEST";
        String cnrNumber = "TEST-CNR-001";

        when(configuration.getIsElasticSearchEnabled()).thenReturn(false);
        when(configuration.getCaseServiceHost()).thenReturn("http://test-host");
        when(configuration.getCaseServiceSearchByCnrNumberEndpoint()).thenReturn("/search");
        when(configuration.getJudgeName()).thenReturn("Test Judge");
        when(configuration.getHearingServiceHost()).thenReturn("http://hearing-host");
        when(configuration.getHearingSearchEndpoint()).thenReturn("/search");

        when(serviceRequestRepository.fetchResult(any(StringBuilder.class), any(OpenApiCaseSummaryRequest.class)))
                .thenReturn(mockCaseSummaryResponse);

        when(objectMapper.convertValue(any(), eq(CaseSummaryResponse.class)))
                .thenReturn(mockCaseSummaryResponse);
        when(objectMapper.convertValue(any(), eq(HearingListResponse.class)))
                .thenReturn(new HearingListResponse());

        // Act
        CaseSummaryResponse response = openApiService.getCaseByCnrNumber(tenantId, cnrNumber);

        // Assert
        assertNotNull(response);
        assertEquals("Test Judge", response.getCaseSummary().getJudgeName());

        // Verify interactions
        verify(serviceRequestRepository).fetchResult(any(StringBuilder.class), any(OpenApiCaseSummaryRequest.class));
        verify(configuration).getIsElasticSearchEnabled();
    }

    @Test
    public void testGetCaseByCnrNumber_ElasticSearchEnabled_ThrowsException() {
        // Arrange
        String tenantId = "TEST";
        String cnrNumber = "TEST-CNR-001";

        when(configuration.getIsElasticSearchEnabled()).thenReturn(true);

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            openApiService.getCaseByCnrNumber(tenantId, cnrNumber);
        });
    }

    @Test
    public void testGetCaseListByCaseType_ValidInput() {
        // Arrange
        String tenantId = "TEST";
        Integer year = 2024;
        String caseType = "CMP";
        Integer offset = 0;
        Integer limit = 10;
        String sort = "registrationDate,asc";

        CaseListResponse mockCaseListResponse = new CaseListResponse();
        List<Hearing> hearings = new ArrayList<Hearing>();
        List<CaseListLineItem> caseSummaryList = new ArrayList<>();
        mockCaseListResponse.setCaseList(caseSummaryList);

        when(configuration.getIsElasticSearchEnabled()).thenReturn(false);
        when(configuration.getCaseServiceHost()).thenReturn("http://test-host");
        when(configuration.getCaseServiceSearchByCaseTypeEndpoint()).thenReturn("/search");
        when(dateUtil.getYearInSeconds(any(Integer.class))).thenReturn(List.of(1672531200L, 1672617600L));

        when(serviceRequestRepository.fetchResult(any(StringBuilder.class), any(OpenApiCaseSummaryRequest.class)))
                .thenReturn(mockCaseListResponse);

        when(objectMapper.convertValue(any(), eq(CaseListResponse.class)))
                .thenReturn(mockCaseListResponse);

        // Act
        CaseListResponse response = openApiService.getCaseListByCaseType(tenantId, year, caseType, offset, limit, sort);

        // Assert
        assertNotNull(response);
        assertEquals(caseSummaryList, response.getCaseList());

        // Verify interactions
        verify(serviceRequestRepository).fetchResult(any(StringBuilder.class), any(OpenApiCaseSummaryRequest.class));
    }

    @Test
    public void testGetCaseByCaseNumber_ValidInput() {
        // Arrange
        String tenantId = "TEST";
        Integer year = 2024;
        String caseType = "CMP";
        Integer caseNumber = 12345;

        when(configuration.getIsElasticSearchEnabled()).thenReturn(false);
        when(configuration.getCaseServiceHost()).thenReturn("http://test-host");
        when(configuration.getCaseServiceSearchByCaseNumberEndpoint()).thenReturn("/search");
        when(configuration.getJudgeName()).thenReturn("Test Judge");
        when(configuration.getHearingServiceHost()).thenReturn("http://hearing-host");
        when(configuration.getHearingSearchEndpoint()).thenReturn("/search");

        when(serviceRequestRepository.fetchResult(any(StringBuilder.class), any(OpenApiCaseSummaryRequest.class)))
                .thenReturn(mockCaseSummaryResponse);

        when(objectMapper.convertValue(any(), eq(CaseSummaryResponse.class)))
                .thenReturn(mockCaseSummaryResponse);
        when(objectMapper.convertValue(any(), eq(HearingListResponse.class)))
                .thenReturn(new HearingListResponse());

        // Act
        CaseSummaryResponse response = openApiService.getCaseByCaseNumber(tenantId, year, caseType, caseNumber);

        // Assert
        assertNotNull(response);
        assertEquals("Test Judge", response.getCaseSummary().getJudgeName());

        // Verify interactions
        verify(serviceRequestRepository).fetchResult(any(StringBuilder.class), any(OpenApiCaseSummaryRequest.class));
    }

    @Test
    public void testEnrichNextHearingDate_SingleScheduledHearing() {
        // Arrange
        String filingNumber = "TEST-FILING-001";

        Hearing scheduledHearing = new Hearing();
        scheduledHearing.setStatus("Scheduled");
        scheduledHearing.setStartTime(1672531200L); // Example timestamp

        HearingListResponse hearingListResponse = new HearingListResponse();
        hearingListResponse.setHearingList(List.of(scheduledHearing));

        when(configuration.getHearingServiceHost()).thenReturn("http://hearing-host");
        when(configuration.getHearingSearchEndpoint()).thenReturn("/search");

        when(serviceRequestRepository.fetchResult(any(StringBuilder.class), any(HearingSearchRequest.class)))
                .thenReturn(hearingListResponse);

        when(objectMapper.convertValue(any(), eq(HearingListResponse.class)))
                .thenReturn(hearingListResponse);

        // Act
        Long nextHearingDate = openApiService.enrichNextHearingDate(filingNumber);

        // Assert
        assertEquals(1672531200L, nextHearingDate);

        // Verify interactions
        verify(serviceRequestRepository).fetchResult(any(StringBuilder.class), any(HearingSearchRequest.class));
    }

    @Test
    public void testEnrichNextHearingDate_MultipleScheduledHearings_ThrowsException() {
        // Arrange
        String filingNumber = "TEST-FILING-001";

        Hearing hearing1 = new Hearing();
        hearing1.setStatus("Scheduled");
        hearing1.setStartTime(1672531200L);

        Hearing hearing2 = new Hearing();
        hearing2.setStatus("Scheduled");
        hearing2.setStartTime(1672617600L);

        HearingListResponse hearingListResponse = new HearingListResponse();
        hearingListResponse.setHearingList(List.of(hearing1, hearing2));

        when(configuration.getHearingServiceHost()).thenReturn("http://hearing-host");
        when(configuration.getHearingSearchEndpoint()).thenReturn("/search");

        when(serviceRequestRepository.fetchResult(any(StringBuilder.class), any(HearingSearchRequest.class)))
                .thenReturn(hearingListResponse);

        when(objectMapper.convertValue(any(), eq(HearingListResponse.class)))
                .thenReturn(hearingListResponse);

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            openApiService.enrichNextHearingDate(filingNumber);
        });
    }

    @Test
    public void testEnrichNextHearingDate_NoScheduledHearings() {
        // Arrange
        String filingNumber = "TEST-FILING-001";

        HearingListResponse hearingListResponse = new HearingListResponse();
        hearingListResponse.setHearingList(new ArrayList<>());

        when(configuration.getHearingServiceHost()).thenReturn("http://hearing-host");
        when(configuration.getHearingSearchEndpoint()).thenReturn("/search");

        when(serviceRequestRepository.fetchResult(any(StringBuilder.class), any(HearingSearchRequest.class)))
                .thenReturn(hearingListResponse);

        when(objectMapper.convertValue(any(), eq(HearingListResponse.class)))
                .thenReturn(hearingListResponse);

        // Act
        Long nextHearingDate = openApiService.enrichNextHearingDate(filingNumber);

        // Assert
        assertNull(nextHearingDate);

        // Verify interactions
        verify(serviceRequestRepository).fetchResult(any(StringBuilder.class), any(HearingSearchRequest.class));
    }

    @Test
    public void testGetCaseListTypeWithElasticSearchEnabled() {
        // Arrange
        String tenantId = "TEST";
        Integer year = 2024;
        String caseType = "CMP";
        Integer offset = 0;
        Integer limit = 10;
        String sort = "registrationDate,asc";

        when(configuration.getIsElasticSearchEnabled()).thenReturn(true);

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            openApiService.getCaseListByCaseType(tenantId, year, caseType, offset, limit, sort);
        });
    }

    @Test
    public void testGetCaseByCaseNumberWithElasticSearchEnabled() {
        // Arrange
        String tenantId = "TEST";
        Integer year = 2024;
        String caseType = "CMP";
        Integer caseNumber = 12345;

        when(configuration.getIsElasticSearchEnabled()).thenReturn(true);

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            openApiService.getCaseByCaseNumber(tenantId, year, caseType, caseNumber);
        });
    }

    @Test
    void getLandingPageCaseList_ThrowsException_WhenElasticSearchEnabled() {
        when(configuration.getIsElasticSearchEnabled()).thenReturn(true);
        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSearchCaseCriteria(validAllCriteria());
        assertThrows(RuntimeException.class, () ->
                openApiService.getLandingPageCaseList(TENANT_ID, request));
    }

    @Test
    void getLandingPageCaseList_CallsInboxUtil_WhenElasticSearchDisabled() {
        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSearchCaseCriteria(validAllCriteria());
        openApiService.getLandingPageCaseList(TENANT_ID, request);
        verify(inboxUtil).getLandingPageCaseListResponse(any(InboxRequest.class));
    }

    @Test
    void getLandingPageCaseList_UsesDefaultLimit_WhenNotProvided() {
        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setLimit(null);
        request.setSearchCaseCriteria(validAllCriteria());
        openApiService.getLandingPageCaseList(TENANT_ID, request);
        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        assertEquals(50, captor.getValue().getInbox().getLimit());
    }

    @Test
    void buildInboxRequest_HandlesFilingNumberCriteria() {
        FilingNumberCriteria filingNumberCriteria = new FilingNumberCriteria();
        filingNumberCriteria.setCode("CMP");
        filingNumberCriteria.setCaseNumber("123");
        filingNumberCriteria.setYear("2023");
        filingNumberCriteria.setCourtName("High Court");

        SearchCaseCriteria searchCriteria = new SearchCaseCriteria();
        searchCriteria.setSearchType(SearchType.FILING_NUMBER);
        searchCriteria.setFilingNumberCriteria(filingNumberCriteria);
        searchCriteria.setCaseNumberCriteria(null);
        searchCriteria.setCnrNumberCriteria(null);
        searchCriteria.setAdvocateCriteria(null);
        searchCriteria.setLitigantCriteria(null);

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSearchCaseCriteria(searchCriteria);

        openApiService.getLandingPageCaseList(TENANT_ID, request);
        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        Map<String, Object> moduleCriteria = captor.getValue().getInbox().getModuleSearchCriteria();
        assertEquals("CMP-123-2023", moduleCriteria.get("filingNumber"));
        assertEquals("High Court", moduleCriteria.get("courtName"));
        assertEquals(TENANT_ID, moduleCriteria.get("tenantId"));
    }

    @Test
    void buildInboxRequest_HandlesFilingNumberCriteria_WithoutCourtName() {
        FilingNumberCriteria filingNumberCriteria = new FilingNumberCriteria();
        filingNumberCriteria.setCode("CMP");
        filingNumberCriteria.setCaseNumber("123");
        filingNumberCriteria.setYear("2023");

        SearchCaseCriteria searchCriteria = new SearchCaseCriteria();
        searchCriteria.setSearchType(SearchType.FILING_NUMBER);
        searchCriteria.setFilingNumberCriteria(filingNumberCriteria);
        searchCriteria.setCaseNumberCriteria(null);
        searchCriteria.setCnrNumberCriteria(null);
        searchCriteria.setAdvocateCriteria(null);
        searchCriteria.setLitigantCriteria(null);

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSearchCaseCriteria(searchCriteria);

        openApiService.getLandingPageCaseList(TENANT_ID, request);
        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        Map<String, Object> moduleCriteria = captor.getValue().getInbox().getModuleSearchCriteria();
        assertEquals("CMP-123-2023", moduleCriteria.get("filingNumber"));
        assertFalse(moduleCriteria.containsKey("courtName"));
        assertEquals(TENANT_ID, moduleCriteria.get("tenantId"));
    }

    @Test
    void buildInboxRequest_HandlesCaseNumberCriteria_InvalidType() {
        CaseNumberCriteria caseNumberCriteria = new CaseNumberCriteria();
        caseNumberCriteria.setCaseType("CIVIL"); // Not ST or CMP
        caseNumberCriteria.setCaseNumber("456");
        caseNumberCriteria.setYear("2023");
        caseNumberCriteria.setCourtName("District Court");

        SearchCaseCriteria searchCriteria = new SearchCaseCriteria();
        searchCriteria.setSearchType(SearchType.CASE_NUMBER);
        searchCriteria.setCaseNumberCriteria(caseNumberCriteria);
        searchCriteria.setFilingNumberCriteria(null);
        searchCriteria.setCnrNumberCriteria(null);
        searchCriteria.setAdvocateCriteria(null);
        searchCriteria.setLitigantCriteria(null);

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSearchCaseCriteria(searchCriteria);

        LandingPageCaseListResponse response = openApiService.getLandingPageCaseList(TENANT_ID, request);
        verify(inboxUtil, never()).getLandingPageCaseListResponse(any());
        assertNotNull(response);
        assertTrue(response.getItems().isEmpty());
    }

    @Test
    void buildInboxRequest_HandlesCaseNumberCriteria_ST() {
        CaseNumberCriteria caseNumberCriteria = new CaseNumberCriteria();
        caseNumberCriteria.setCaseType("ST");
        caseNumberCriteria.setCaseNumber("456");
        caseNumberCriteria.setYear("2023");
        caseNumberCriteria.setCourtName("District Court");

        SearchCaseCriteria searchCriteria = new SearchCaseCriteria();
        searchCriteria.setSearchType(SearchType.CASE_NUMBER);
        searchCriteria.setCaseNumberCriteria(caseNumberCriteria);
        searchCriteria.setFilingNumberCriteria(null);
        searchCriteria.setCnrNumberCriteria(null);
        searchCriteria.setAdvocateCriteria(null);
        searchCriteria.setLitigantCriteria(null);

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSearchCaseCriteria(searchCriteria);

        openApiService.getLandingPageCaseList(TENANT_ID, request);
        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        Map<String, Object> moduleCriteria = captor.getValue().getInbox().getModuleSearchCriteria();
        assertEquals("ST/456/2023", moduleCriteria.get("stNumber"));
        assertEquals("District Court", moduleCriteria.get("courtName"));
        assertEquals(TENANT_ID, moduleCriteria.get("tenantId"));
        assertFalse(moduleCriteria.containsKey("cmpNumber"));
    }



    @Test
    void buildInboxRequest_HandlesCnrNumberCriteria() {
        CnrNumberCriteria cnrNumberCriteria = new CnrNumberCriteria();
        cnrNumberCriteria.setCnrNumber("CNR-12345");

        SearchCaseCriteria searchCriteria = new SearchCaseCriteria();
        searchCriteria.setSearchType(SearchType.CNR_NUMBER);
        searchCriteria.setCnrNumberCriteria(cnrNumberCriteria);
        searchCriteria.setFilingNumberCriteria(null);
        searchCriteria.setCaseNumberCriteria(null);
        searchCriteria.setAdvocateCriteria(null);
        searchCriteria.setLitigantCriteria(null);

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSearchCaseCriteria(searchCriteria);

        openApiService.getLandingPageCaseList(TENANT_ID, request);
        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        Map<String, Object> moduleCriteria = captor.getValue().getInbox().getModuleSearchCriteria();
        assertEquals("CNR-12345", moduleCriteria.get("cnrNumber"));
        assertEquals(TENANT_ID, moduleCriteria.get("tenantId"));
    }

    @Test
    void buildInboxRequest_HandlesCaseNumberCriteria_CMP() {
        CaseNumberCriteria caseNumberCriteria = new CaseNumberCriteria();
        caseNumberCriteria.setCaseType("CMP");
        caseNumberCriteria.setCaseNumber("789");
        caseNumberCriteria.setYear("2024");
        caseNumberCriteria.setCourtName("High Court");

        SearchCaseCriteria searchCriteria = new SearchCaseCriteria();
        searchCriteria.setSearchType(SearchType.CASE_NUMBER);
        searchCriteria.setCaseNumberCriteria(caseNumberCriteria);
        searchCriteria.setFilingNumberCriteria(null);
        searchCriteria.setCnrNumberCriteria(null);
        searchCriteria.setAdvocateCriteria(null);
        searchCriteria.setLitigantCriteria(null);

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSearchCaseCriteria(searchCriteria);

        openApiService.getLandingPageCaseList(TENANT_ID, request);
        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        Map<String, Object> moduleCriteria = captor.getValue().getInbox().getModuleSearchCriteria();
        assertEquals("CMP/789/2024", moduleCriteria.get("cmpNumber"));
        assertEquals("High Court", moduleCriteria.get("courtName"));
        assertEquals(TENANT_ID, moduleCriteria.get("tenantId"));
        assertFalse(moduleCriteria.containsKey("stNumber"));
    }



    @Test
    void buildInboxRequest_HandlesAdvocateBarcodeCriteria_Found() {
        BarCodeDetails barCode = new BarCodeDetails();
        barCode.setStateCode("PB");
        barCode.setBarCode("BC123");
        barCode.setYear("2023");

        AdvocateCriteria advocateCriteria = new AdvocateCriteria();
        advocateCriteria.setAdvocateSearchType(AdvocateSearchType.BARCODE);
        advocateCriteria.setBarCodeDetails(barCode);

        Advocate advocate = new Advocate();
        UUID advocateId = UUID.randomUUID();
        advocate.setId(advocateId);
        when(advocateUtil.fetchAdvocatesByBarRegistrationNumber("PB/BC123/2023"))
                .thenReturn(Collections.singletonList(advocate));

        SearchCaseCriteria searchCriteria = new SearchCaseCriteria();
        searchCriteria.setSearchType(SearchType.ADVOCATE);
        searchCriteria.setAdvocateCriteria(advocateCriteria);

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSearchCaseCriteria(searchCriteria);

        openApiService.getLandingPageCaseList(TENANT_ID, request);
        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        Map<String, Object> moduleCriteria = captor.getValue().getInbox().getModuleSearchCriteria();
        assertEquals(advocateId, moduleCriteria.get("advocateId"));
        assertEquals(TENANT_ID, moduleCriteria.get("tenantId"));
    }

    @Test
    void buildInboxRequest_HandlesAdvocateBarcodeCriteria_NotFound() {
        BarCodeDetails barCode = new BarCodeDetails();
        barCode.setStateCode("PB");
        barCode.setBarCode("BC123");
        barCode.setYear("2023");

        AdvocateCriteria advocateCriteria = new AdvocateCriteria();
        advocateCriteria.setAdvocateSearchType(AdvocateSearchType.BARCODE);
        advocateCriteria.setBarCodeDetails(barCode);

        when(advocateUtil.fetchAdvocatesByBarRegistrationNumber("PB/BC123/2023"))
                .thenReturn(Collections.emptyList());

        SearchCaseCriteria searchCriteria = new SearchCaseCriteria();
        searchCriteria.setSearchType(SearchType.ADVOCATE);
        searchCriteria.setAdvocateCriteria(advocateCriteria);

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSearchCaseCriteria(searchCriteria);

        LandingPageCaseListResponse response = openApiService.getLandingPageCaseList(TENANT_ID, request);
        assertNotNull(response);
        assertTrue(response.getItems().isEmpty());
    }

    @Test
    void buildInboxRequest_HandlesAdvocateBarcodeCriteria_IncompleteDetails() {
        AdvocateCriteria advocateCriteria = new AdvocateCriteria();
        advocateCriteria.setAdvocateSearchType(AdvocateSearchType.BARCODE);
        advocateCriteria.setBarCodeDetails(null);

        SearchCaseCriteria searchCriteria = new SearchCaseCriteria();
        searchCriteria.setSearchType(SearchType.ADVOCATE);
        searchCriteria.setAdvocateCriteria(advocateCriteria);

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSearchCaseCriteria(searchCriteria);

        LandingPageCaseListResponse response = openApiService.getLandingPageCaseList(TENANT_ID, request);
        assertNotNull(response);
        assertTrue(response.getItems().isEmpty());
    }

    @Test
    void buildInboxRequest_HandlesAdvocateNameCriteria() {
        AdvocateCriteria advocateCriteria = new AdvocateCriteria();
        advocateCriteria.setAdvocateSearchType(AdvocateSearchType.ADVOCATE_NAME);
        advocateCriteria.setAdvocateName("John Doe");

        SearchCaseCriteria searchCriteria = new SearchCaseCriteria();
        searchCriteria.setSearchType(SearchType.ADVOCATE);
        searchCriteria.setAdvocateCriteria(advocateCriteria);
        searchCriteria.setFilingNumberCriteria(null);
        searchCriteria.setCaseNumberCriteria(null);
        searchCriteria.setCnrNumberCriteria(null);
        searchCriteria.setLitigantCriteria(null);

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSearchCaseCriteria(searchCriteria);

        openApiService.getLandingPageCaseList(TENANT_ID, request);
        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        Map<String, Object> moduleCriteria = captor.getValue().getInbox().getModuleSearchCriteria();
        assertEquals("John Doe", moduleCriteria.get("advocateName"));
        assertEquals(TENANT_ID, moduleCriteria.get("tenantId"));
    }

    @Test
    void buildInboxRequest_HandlesLitigantCriteria() {
        LitigantCriteria litigantCriteria = new LitigantCriteria();
        litigantCriteria.setLitigantName("Jane Smith");

        SearchCaseCriteria searchCriteria = new SearchCaseCriteria();
        searchCriteria.setSearchType(SearchType.LITIGANT);
        searchCriteria.setLitigantCriteria(litigantCriteria);
        searchCriteria.setFilingNumberCriteria(null);
        searchCriteria.setCaseNumberCriteria(null);
        searchCriteria.setCnrNumberCriteria(null);
        searchCriteria.setAdvocateCriteria(null);

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSearchCaseCriteria(searchCriteria);

        openApiService.getLandingPageCaseList(TENANT_ID, request);
        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        Map<String, Object> moduleCriteria = captor.getValue().getInbox().getModuleSearchCriteria();
        assertEquals("Jane Smith", moduleCriteria.get("litigantName"));
        assertEquals(TENANT_ID, moduleCriteria.get("tenantId"));
    }

    // New: Test mapping of advocate and litigant PartyInfo in LandingPageCase
    @Test
    void getLandingPageCaseListResponse_MapsAdvocateAndLitigantFields() {
        LandingPageCaseListResponse mockResponse = new LandingPageCaseListResponse();
        LandingPageCase caseObj = new LandingPageCase();
        PartyInfo advocate1 = PartyInfo.builder().id("adv1").name("Advocate One").entityType("ADVOCATE").build();
        PartyInfo advocate2 = PartyInfo.builder().id("adv2").name("Advocate Two").entityType("ADVOCATE").build();
        PartyInfo litigant1 = PartyInfo.builder().id("lit1").name("Litigant One").entityType("LITIGANT").build();
        PartyInfo litigant2 = PartyInfo.builder().id("lit2").name("Litigant Two").entityType("LITIGANT").build();
        caseObj.setAdvocates(Arrays.asList(advocate1, advocate2));
        caseObj.setLitigants(Arrays.asList(litigant1, litigant2));
        mockResponse.setItems(Collections.singletonList(caseObj));

        when(inboxUtil.getLandingPageCaseListResponse(any())).thenReturn(mockResponse);

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSearchCaseCriteria(validAllCriteria()); // ADD THIS LINE
        LandingPageCaseListResponse response = openApiService.getLandingPageCaseList(TENANT_ID, request);

        assertNotNull(response);
        assertFalse(response.getItems().isEmpty());
        LandingPageCase actualCase = response.getItems().get(0);
        assertEquals(2, actualCase.getAdvocates().size());
        assertEquals("Advocate One", actualCase.getAdvocates().get(0).getName());
        assertEquals(2, actualCase.getLitigants().size());
        assertEquals("Litigant Two", actualCase.getLitigants().get(1).getName());
    }

    @Test
    void getLandingPageCaseListResponse_HandlesNullAndEmptyAdvocateLitigant() {
        LandingPageCaseListResponse mockResponse = new LandingPageCaseListResponse();
        LandingPageCase caseObj = new LandingPageCase();
        caseObj.setAdvocates(null);
        caseObj.setLitigants(Collections.emptyList());
        mockResponse.setItems(Collections.singletonList(caseObj));

        when(inboxUtil.getLandingPageCaseListResponse(any())).thenReturn(mockResponse);

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSearchCaseCriteria(validAllCriteria()); // ADD THIS LINE
        LandingPageCaseListResponse response = openApiService.getLandingPageCaseList(TENANT_ID, request);

        assertNotNull(response);
        assertFalse(response.getItems().isEmpty());
        LandingPageCase actualCase = response.getItems().get(0);
        assertNull(actualCase.getAdvocates());
        assertNotNull(actualCase.getLitigants());
        assertTrue(actualCase.getLitigants().isEmpty());
    }
    @Test
    void buildInboxRequest_HandlesAllSearchType() {
        SearchCaseCriteria searchCriteria = new SearchCaseCriteria();
        searchCriteria.setSearchType(SearchType.ALL);
        searchCriteria.setFilingNumberCriteria(null);
        searchCriteria.setCaseNumberCriteria(null);
        searchCriteria.setCnrNumberCriteria(null);
        searchCriteria.setAdvocateCriteria(null);
        searchCriteria.setLitigantCriteria(null);

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSearchCaseCriteria(searchCriteria);

        openApiService.getLandingPageCaseList(TENANT_ID, request);

        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        Map<String, Object> moduleCriteria = captor.getValue().getInbox().getModuleSearchCriteria();

        // The only key should be tenantId
        assertEquals(2, moduleCriteria.size());
        assertEquals(TENANT_ID, moduleCriteria.get("tenantId"));
    }

    // --- For all the following tests, provide a valid ALL criteria ---
    @Test
    void    buildInboxRequest_HandlesFilterCriteria() {
        FilterCriteria filterCriteria = new FilterCriteria();
        filterCriteria.setCourtName("Supreme Court");
        filterCriteria.setCaseType("Criminal");
        filterCriteria.setHearingDateFrom(LocalDate.of(2023, 1, 1));
        filterCriteria.setHearingDateTo(LocalDate.of(2023, 12, 31));
        filterCriteria.setCaseSubStage("Appearance");
        filterCriteria.setCaseStatus("Active");
        filterCriteria.setYearOfFiling("2022");
        filterCriteria.setCaseTitle("Test1 vs Test2");
        List<String> expectedStatuses = Arrays.asList(
                "UNDER_SCRUTINY",
                "PENDING_REGISTRATION",
                "CASE_REASSIGNED",
                "PENDING_RE_E-SIGN",
                "PENDING_RE_SIGN",
                "PENDING_NOTICE",
                "PENDING_RESPONSE",
                "PENDING_ADMISSION",
                "CASE_ADMITTED",
                "CASE_DISMISSED",
                "RE_PENDING_PAYMENT"
        );

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setFilterCriteria(filterCriteria);
        request.setSearchCaseCriteria(validAllCriteria());

        // Mock the epoch conversion for the specific dates
        when(dateUtil.getEpochFromLocalDate(LocalDate.of(2023, 1, 1)))
                .thenReturn(1672501800000L);
        lenient().when(dateUtil.getEpochFromLocalDate(LocalDate.of(2023, 12, 31)))
                .thenReturn(1703961000000L);

        // If your code uses config.getZoneId() elsewhere, mock it as well
        when(configuration.getZoneId()).thenReturn("Asia/Kolkata");
        when(configuration.getAllowedCaseStatuses()).thenReturn(expectedStatuses);

        // Act
        openApiService.getLandingPageCaseList("tenantId", request);

        // Assert
        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        Map<String, Object> moduleCriteria = captor.getValue().getInbox().getModuleSearchCriteria();
        assertEquals("Supreme Court", moduleCriteria.get("courtName"));
        assertEquals("Criminal", moduleCriteria.get("caseType"));
        // Assert mocked epoch millis as String
        assertEquals("1672501800000", moduleCriteria.get("hearingDateFrom"));
        assertEquals("1704047399999", moduleCriteria.get("hearingDateTo"));
        assertEquals("Appearance", moduleCriteria.get("caseSubStage"));
        assertEquals(expectedStatuses, moduleCriteria.get("caseStatus"));
        assertEquals("2022", moduleCriteria.get("yearOfFiling"));
        assertEquals("Test1 vs Test2", moduleCriteria.get("caseTitle"));
        assertEquals("tenantId", moduleCriteria.get("tenantId"));
    }

    @Test
    void buildInboxRequest_HandlesPartialFilterCriteria() {
        FilterCriteria filterCriteria = new FilterCriteria();
        filterCriteria.setCourtName("High Court");
        filterCriteria.setCaseType("Civil");

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setFilterCriteria(filterCriteria);
        request.setSearchCaseCriteria(validAllCriteria());

        openApiService.getLandingPageCaseList(TENANT_ID, request);

        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        Map<String, Object> moduleCriteria = captor.getValue().getInbox().getModuleSearchCriteria();
        assertEquals("High Court", moduleCriteria.get("courtName"));
        assertEquals("Civil", moduleCriteria.get("caseType"));
        assertFalse(moduleCriteria.containsKey("hearingDateFrom"));
        assertEquals(TENANT_ID, moduleCriteria.get("tenantId"));
    }

    @Test
    void buildInboxRequest_HandlesSortOrderWithEnum() {
        OrderBy order1 = new OrderBy("field1", Order.ASC);
        OrderBy order2 = new OrderBy("field2", Order.DESC);
        List<OrderBy> sortOrder = Arrays.asList(order1, order2);

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSortOrder(sortOrder);
        request.setSearchCaseCriteria(validAllCriteria());

        openApiService.getLandingPageCaseList(TENANT_ID, request);

        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        List<OrderBy> resultOrder = captor.getValue().getInbox().getSortOrder();
        assertEquals(2, resultOrder.size());
        assertEquals(Order.ASC, resultOrder.get(0).getOrder());
        assertEquals(Order.DESC, resultOrder.get(1).getOrder());
        assertEquals(TENANT_ID, captor.getValue().getInbox().getModuleSearchCriteria().get("tenantId"));
    }

    @Test
    void buildInboxRequest_HandlesNullSortOrder() {
        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSortOrder(null);
        request.setSearchCaseCriteria(validAllCriteria());

        openApiService.getLandingPageCaseList(TENANT_ID, request);

        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        assertNull(captor.getValue().getInbox().getSortOrder());
        assertEquals(TENANT_ID, captor.getValue().getInbox().getModuleSearchCriteria().get("tenantId"));
    }

    @Test
    void buildInboxRequest_HandlesPagination() {
        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setOffset(10);
        request.setLimit(25);
        request.setSearchCaseCriteria(validAllCriteria());

        openApiService.getLandingPageCaseList(TENANT_ID, request);

        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        assertEquals(10, captor.getValue().getInbox().getOffset());
        assertEquals(25, captor.getValue().getInbox().getLimit());
        assertEquals(TENANT_ID, captor.getValue().getInbox().getModuleSearchCriteria().get("tenantId"));
    }

    @Test
    void buildInboxRequest_UsesDefaultLimit_WhenNull() {
        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setOffset(0);
        request.setLimit(null);
        request.setSearchCaseCriteria(validAllCriteria());

        openApiService.getLandingPageCaseList(TENANT_ID, request);

        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        assertEquals(50, captor.getValue().getInbox().getLimit());
        assertEquals(TENANT_ID, captor.getValue().getInbox().getModuleSearchCriteria().get("tenantId"));
    }

    @Test
    void buildInboxRequest_SetsProcessSearchCriteria() {
        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSearchCaseCriteria(validAllCriteria());

        openApiService.getLandingPageCaseList(TENANT_ID, request);

        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        ProcessInstanceSearchCriteria processCriteria = captor.getValue().getInbox().getProcessSearchCriteria();
        assertEquals("Openapi Service", processCriteria.getModuleName());
        assertEquals(Collections.singletonList("openapi"), processCriteria.getBusinessService());
        assertEquals(TENANT_ID, processCriteria.getTenantId());
        assertEquals(TENANT_ID, captor.getValue().getInbox().getModuleSearchCriteria().get("tenantId"));
    }

    @Test
    void buildInboxRequest_HandlesNullOrderByValues() {
        OrderBy order = new OrderBy(null, null);
        List<OrderBy> sortOrder = Collections.singletonList(order);

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSortOrder(sortOrder);
        request.setSearchCaseCriteria(validAllCriteria());

        openApiService.getLandingPageCaseList(TENANT_ID, request);

        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        assertNotNull(captor.getValue().getInbox().getSortOrder());
        assertNull(captor.getValue().getInbox().getSortOrder().get(0).getCode());
        assertNull(captor.getValue().getInbox().getSortOrder().get(0).getOrder());
        assertEquals(TENANT_ID, captor.getValue().getInbox().getModuleSearchCriteria().get("tenantId"));
    }


    private SearchCaseCriteria validAllCriteria() {
        SearchCaseCriteria criteria = new SearchCaseCriteria();
        criteria.setSearchType(SearchType.ALL);
        criteria.setFilingNumberCriteria(null);
        criteria.setCaseNumberCriteria(null);
        criteria.setCnrNumberCriteria(null);
        criteria.setAdvocateCriteria(null);
        criteria.setLitigantCriteria(null);
        return criteria;
    }



}