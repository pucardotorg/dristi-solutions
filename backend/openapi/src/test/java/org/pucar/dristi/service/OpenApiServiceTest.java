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
import org.pucar.dristi.util.DateUtil;
import org.pucar.dristi.web.models.*;

import java.time.LocalDate;
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

        assertThrows(RuntimeException.class, () ->
                openApiService.getLandingPageCaseList(TENANT_ID, request));
    }

    @Test
    void getLandingPageCaseList_CallsInboxUtil_WhenElasticSearchDisabled() {
        LandingPageCaseListRequest request = new LandingPageCaseListRequest();

        openApiService.getLandingPageCaseList(TENANT_ID, request);

        verify(inboxUtil).getLandingPageCaseListResponse(any(InboxRequest.class));
    }

    @Test
    void getLandingPageCaseList_UsesDefaultLimit_WhenNotProvided() {
        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setLimit(null);

        openApiService.getLandingPageCaseList(TENANT_ID, request);

        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        assertEquals(50, captor.getValue().getInbox().getLimit());
    }

    // ========== buildInboxRequestFromSearchCriteria (indirectly tested) ==========

    @Test
    void buildInboxRequest_HandlesFilingNumberCriteria() {
        FilingNumberCriteria filingCriteria = new FilingNumberCriteria();
        filingCriteria.setCode("CMP");
        filingCriteria.setCaseNumber("123");
        filingCriteria.setYear("2023");
        filingCriteria.setCourtName("High Court");

        SearchCaseCriteria searchCriteria = new SearchCaseCriteria();
        searchCriteria.setSearchType(SearchType.FILING_NUMBER);
        searchCriteria.setFilingNumberCriteria(filingCriteria);

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSearchCaseCriteria(searchCriteria);

        openApiService.getLandingPageCaseList(TENANT_ID, request);

        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        Map<String, Object> moduleCriteria = captor.getValue().getInbox().getModuleSearchCriteria();
        assertEquals("CMP-123-2023", moduleCriteria.get("filingNumber"));
        assertEquals("High Court", moduleCriteria.get("courtName"));
    }

    @Test
    void buildInboxRequest_HandlesFilingNumberCriteria_WithoutCourtName() {
        FilingNumberCriteria filingCriteria = new FilingNumberCriteria();
        filingCriteria.setCode("CMP");
        filingCriteria.setCaseNumber("123");
        filingCriteria.setYear("2023");

        SearchCaseCriteria searchCriteria = new SearchCaseCriteria();
        searchCriteria.setSearchType(SearchType.FILING_NUMBER);
        searchCriteria.setFilingNumberCriteria(filingCriteria);

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSearchCaseCriteria(searchCriteria);

        openApiService.getLandingPageCaseList(TENANT_ID, request);

        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        Map<String, Object> moduleCriteria = captor.getValue().getInbox().getModuleSearchCriteria();
        assertEquals("CMP-123-2023", moduleCriteria.get("filingNumber"));
        assertFalse(moduleCriteria.containsKey("courtName"));
    }

    @Test
    void buildInboxRequest_HandlesCaseNumberCriteria() {
        CaseNumberCriteria caseCriteria = new CaseNumberCriteria();
        caseCriteria.setCaseType("CIVIL");
        caseCriteria.setCaseNumber("456");
        caseCriteria.setYear("2023");
        caseCriteria.setCourtName("District Court");

        SearchCaseCriteria searchCriteria = new SearchCaseCriteria();
        searchCriteria.setSearchType(SearchType.CASE_NUMBER);
        searchCriteria.setCaseNumberCriteria(caseCriteria);

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSearchCaseCriteria(searchCriteria);

        openApiService.getLandingPageCaseList(TENANT_ID, request);

        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        Map<String, Object> moduleCriteria = captor.getValue().getInbox().getModuleSearchCriteria();
        assertEquals("CIVIL/456/2023", moduleCriteria.get("caseNumber"));
        assertEquals("District Court", moduleCriteria.get("courtName"));
    }

    @Test
    void buildInboxRequest_HandlesCnrNumberCriteria() {
        CnrNumberCriteria cnrCriteria = new CnrNumberCriteria();
        cnrCriteria.setCnrNumber("CNR-12345");

        SearchCaseCriteria searchCriteria = new SearchCaseCriteria();
        searchCriteria.setSearchType(SearchType.CNR_NUMBER);
        searchCriteria.setCnrNumberCriteria(cnrCriteria);

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSearchCaseCriteria(searchCriteria);

        openApiService.getLandingPageCaseList(TENANT_ID, request);

        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        Map<String, Object> moduleCriteria = captor.getValue().getInbox().getModuleSearchCriteria();
        assertEquals("CNR-12345", moduleCriteria.get("cnrNumber"));
    }

    @Test
    void buildInboxRequest_HandlesAdvocateBarcodeCriteria() {
        BarCodeDetails barCode = new BarCodeDetails();
        barCode.setStateCode("PB");
        barCode.setBarCode("BC123");
        barCode.setYear("2023");

        AdvocateCriteria advocateCriteria = new AdvocateCriteria();
        advocateCriteria.setAdvocateSearchType(AdvocateSearchType.BARCODE);
        advocateCriteria.setBarCodeDetails(barCode);

        SearchCaseCriteria searchCriteria = new SearchCaseCriteria();
        searchCriteria.setSearchType(SearchType.ADVOCATE);
        searchCriteria.setAdvocateCriteria(advocateCriteria);

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSearchCaseCriteria(searchCriteria);

        openApiService.getLandingPageCaseList(TENANT_ID, request);

        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        Map<String, Object> moduleCriteria = captor.getValue().getInbox().getModuleSearchCriteria();
        assertEquals("PB-BC123-2023", moduleCriteria.get("barCode"));
    }

    @Test
    void buildInboxRequest_HandlesAdvocateNameCriteria() {
        AdvocateCriteria advocateCriteria = new AdvocateCriteria();
        advocateCriteria.setAdvocateSearchType(AdvocateSearchType.ADVOCATE_NAME);
        advocateCriteria.setAdvocateName("John Doe");

        SearchCaseCriteria searchCriteria = new SearchCaseCriteria();
        searchCriteria.setSearchType(SearchType.ADVOCATE);
        searchCriteria.setAdvocateCriteria(advocateCriteria);

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSearchCaseCriteria(searchCriteria);

        openApiService.getLandingPageCaseList(TENANT_ID, request);

        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        Map<String, Object> moduleCriteria = captor.getValue().getInbox().getModuleSearchCriteria();
        assertEquals(Collections.singletonList("John Doe"), moduleCriteria.get("advocateName"));
    }

    @Test
    void buildInboxRequest_HandlesLitigantCriteria() {
        LitigantCriteria litigantCriteria = new LitigantCriteria();
        litigantCriteria.setLitigantName("Jane Smith");

        SearchCaseCriteria searchCriteria = new SearchCaseCriteria();
        searchCriteria.setSearchType(SearchType.LITIGANT);
        searchCriteria.setLitigantCriteria(litigantCriteria);

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSearchCaseCriteria(searchCriteria);

        openApiService.getLandingPageCaseList(TENANT_ID, request);

        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        Map<String, Object> moduleCriteria = captor.getValue().getInbox().getModuleSearchCriteria();
        assertEquals(Collections.singletonList("Jane Smith"), moduleCriteria.get("litigantName"));
    }

    @Test
    void buildInboxRequest_HandlesAllSearchType() {
        SearchCaseCriteria searchCriteria = new SearchCaseCriteria();
        searchCriteria.setSearchType(SearchType.ALL);

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSearchCaseCriteria(searchCriteria);

        openApiService.getLandingPageCaseList(TENANT_ID, request);

        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        Map<String, Object> moduleCriteria = captor.getValue().getInbox().getModuleSearchCriteria();
        assertTrue(moduleCriteria.isEmpty());
    }

    @Test
    void buildInboxRequest_HandlesFilterCriteria() {
        FilterCriteria filterCriteria = new FilterCriteria();
        filterCriteria.setCourtName("Supreme Court");
        filterCriteria.setCaseType("Criminal");
        filterCriteria.setHearingDateFrom(LocalDate.of(2023, 1, 1));
        filterCriteria.setHearingDateTo(LocalDate.of(2023, 12, 31));
        filterCriteria.setCaseStage("Trial");
        filterCriteria.setCaseStatus("Active");
        filterCriteria.setYearOfFiling("2022");

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setFilterCriteria(filterCriteria);

        openApiService.getLandingPageCaseList(TENANT_ID, request);

        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        Map<String, Object> moduleCriteria = captor.getValue().getInbox().getModuleSearchCriteria();
        assertEquals("Supreme Court", moduleCriteria.get("courtName"));
        assertEquals("Criminal", moduleCriteria.get("caseType"));
        assertEquals("2023-01-01", moduleCriteria.get("hearingDateFrom"));
        assertEquals("2023-12-31", moduleCriteria.get("hearingDateTo"));
        assertEquals("Trial", moduleCriteria.get("caseStage"));
        assertEquals("Active", moduleCriteria.get("caseStatus"));
        assertEquals("2022", moduleCriteria.get("yearOfFiling"));
    }

    @Test
    void buildInboxRequest_HandlesPartialFilterCriteria() {
        FilterCriteria filterCriteria = new FilterCriteria();
        filterCriteria.setCourtName("High Court");
        filterCriteria.setCaseType("Civil");

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setFilterCriteria(filterCriteria);

        openApiService.getLandingPageCaseList(TENANT_ID, request);

        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        Map<String, Object> moduleCriteria = captor.getValue().getInbox().getModuleSearchCriteria();
        assertEquals("High Court", moduleCriteria.get("courtName"));
        assertEquals("Civil", moduleCriteria.get("caseType"));
        assertFalse(moduleCriteria.containsKey("hearingDateFrom"));
    }

    @Test
    void buildInboxRequest_HandlesSortOrderWithString() {
        OrderBy order1 = new OrderBy("field1", Order.ASC);
        OrderBy order2 = new OrderBy("field2", Order.DESC);
        List<OrderBy> sortOrder = Arrays.asList(order1, order2);

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSortOrder(sortOrder);

        openApiService.getLandingPageCaseList(TENANT_ID, request);

        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        List<OrderBy> resultOrder = captor.getValue().getInbox().getSortOrder();
        assertEquals(2, resultOrder.size());
        assertEquals("asc", resultOrder.get(0).getOrder().toString());
        assertEquals("desc", resultOrder.get(1).getOrder().toString());
    }

    @Test
    void buildInboxRequest_HandlesNullSortOrder() {
        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSortOrder(null);

        openApiService.getLandingPageCaseList(TENANT_ID, request);

        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        assertNull(captor.getValue().getInbox().getSortOrder());
    }

    @Test
    void buildInboxRequest_HandlesPagination() {
        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setOffset(10);
        request.setLimit(25);

        openApiService.getLandingPageCaseList(TENANT_ID, request);

        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        assertEquals(10, captor.getValue().getInbox().getOffset());
        assertEquals(25, captor.getValue().getInbox().getLimit());
    }

    @Test
    void buildInboxRequest_UsesDefaultLimit_WhenNull() {
        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setOffset(0);
        request.setLimit(null);

        openApiService.getLandingPageCaseList(TENANT_ID, request);

        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        assertEquals(50, captor.getValue().getInbox().getLimit());
    }

    @Test
    void buildInboxRequest_SetsProcessSearchCriteria() {
        LandingPageCaseListRequest request = new LandingPageCaseListRequest();

        openApiService.getLandingPageCaseList(TENANT_ID, request);

        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        ProcessInstanceSearchCriteria processCriteria = captor.getValue().getInbox().getProcessSearchCriteria();
        assertEquals("Case Search", processCriteria.getModuleName());
        assertEquals(Collections.singletonList("CASE_BUSINESS_SERVICE"), processCriteria.getBusinessService());
        assertEquals(TENANT_ID, processCriteria.getTenantId());
    }

    @Test
    void buildInboxRequest_HandlesNullOrderByValues() {
        OrderBy order = new OrderBy(null, null);
        List<OrderBy> sortOrder = Collections.singletonList(order);

        LandingPageCaseListRequest request = new LandingPageCaseListRequest();
        request.setSortOrder(sortOrder);

        openApiService.getLandingPageCaseList(TENANT_ID, request);

        ArgumentCaptor<InboxRequest> captor = ArgumentCaptor.forClass(InboxRequest.class);
        verify(inboxUtil).getLandingPageCaseListResponse(captor.capture());
        assertNotNull(captor.getValue().getInbox().getSortOrder());
        assertNull(captor.getValue().getInbox().getSortOrder().get(0).getCode());
        assertNull(captor.getValue().getInbox().getSortOrder().get(0).getOrder());
    }
}