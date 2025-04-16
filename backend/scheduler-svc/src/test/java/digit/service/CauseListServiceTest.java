package digit.service;

import digit.config.Configuration;
import digit.config.ServiceConstants;
import digit.kafka.producer.Producer;
import digit.repository.CauseListRepository;
import digit.repository.HearingRepository;
import digit.util.FileStoreUtil;
import digit.util.MdmsUtil;
import digit.util.PdfServiceUtil;
import digit.web.models.*;
import net.minidev.json.JSONArray;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.core.io.ByteArrayResource;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class CauseListServiceTest {

    @InjectMocks
    private CauseListService causeListService;

    @Mock
    private HearingRepository hearingRepository;

    @Mock
    private CauseListRepository causeListRepository;

    @Mock
    private Producer producer;

    @Mock
    private Configuration config;

    @Mock
    private PdfServiceUtil pdfServiceUtil;

    @Mock
    private MdmsUtil mdmsUtil;

    @Mock
    private FileStoreUtil fileStoreUtil;

    @Mock
    private ServiceConstants serviceConstants;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testUpdateCauseListForTomorrow_noHearings() {
        // Mocking
        when(hearingRepository.getHearings(any(), any(), any())).thenReturn(Collections.emptyList());

        // Test
        causeListService.updateCauseListForTomorrow();

        // Verify
        verify(producer, never()).push(anyString(), any());
    }

    @Test
    void testUpdateCauseListForTomorrow_withHearings() {
        // Mocking
        List<ScheduleHearing> hearings = new ArrayList<>();
        hearings.add(ScheduleHearing.builder().judgeId("judge001").hearingType("ADMISSION").build());
        when(hearingRepository.getHearings(any(), any(), any())).thenReturn(hearings);
        when(mdmsUtil.fetchMdmsData(any(), any(), any(), any())).thenReturn(getMockMdmsData());
        when(config.getCauseListInsertTopic()).thenReturn("causeListInsertTopic");

        // Test
        causeListService.updateCauseListForTomorrow();

    }

    @Test
    void testViewCauseListForTomorrow_validDate() {
        // Mocking
        CauseListSearchCriteria criteria = CauseListSearchCriteria.builder().searchDate(LocalDate.now().plusDays(1)).build();
        CauseListSearchRequest request = CauseListSearchRequest.builder().causeListSearchCriteria(criteria).build();
        List<CauseList> expectedCauseLists = new ArrayList<>();
        when(causeListRepository.getCauseLists(any())).thenReturn(expectedCauseLists);

        // Test
        List<CauseList> causeLists = causeListService.viewCauseListForTomorrow(request);

        // Verify
        assertEquals(expectedCauseLists, causeLists);
    }

    @Test
    void testViewCauseListForTomorrow_invalidDate() {
        // Mocking
        CauseListSearchCriteria criteria = CauseListSearchCriteria.builder().searchDate(LocalDate.now().plusDays(2)).build();
        CauseListSearchRequest request = CauseListSearchRequest.builder().causeListSearchCriteria(criteria).build();

        // Test & Verify
        assertThrows(CustomException.class, () -> causeListService.viewCauseListForTomorrow(request));
    }

    @Test
    void testDownloadCauseListForTomorrow_Success() {
        // Given
        CauseListSearchRequest searchRequest = mock(CauseListSearchRequest.class);
        CauseListSearchCriteria criteria = mock(CauseListSearchCriteria.class);
        when(searchRequest.getCauseListSearchCriteria()).thenReturn(criteria);

        List<String> fileStoreIds = Arrays.asList("fileStoreId1");
        when(causeListService.getFileStoreForCauseList(criteria)).thenReturn(fileStoreIds);

        byte[] expectedPdfBytes = "dummyPdfBytes".getBytes();
        when(config.getEgovStateTenantId()).thenReturn("someTenantId");
        when(fileStoreUtil.getFile("someTenantId", "fileStoreId1")).thenReturn(expectedPdfBytes);

        ByteArrayResource result = causeListService.downloadCauseListForTomorrow(searchRequest);

        assertNotNull(result);
        assertArrayEquals(expectedPdfBytes, result.getByteArray());
        verify(fileStoreUtil, times(1)).getFile("someTenantId", "fileStoreId1");
    }

    @Test
    void testGetRecentCauseList_withValidRequest_shouldReturnResults() {
        // Given
        String courtId = "COURT123";
        RecentCauseListSearchCriteria innerCriteria = RecentCauseListSearchCriteria.builder()
                .courtId(courtId)
                .build();

        RecentCauseListSearchRequest request = RecentCauseListSearchRequest.builder()
                .recentCauseListSearchCriteria(innerCriteria)
                .build();

        List<String> dummyFileStores = Collections.singletonList("file-123");

        when(config.getCutoffTime()).thenReturn("17:00");
        when(causeListRepository.getCauseListFileStore(any(CauseListSearchCriteria.class)))
                .thenReturn(dummyFileStores);

        // When
        List<RecentCauseList> result = causeListService.getRecentCauseList(request);

        // Then
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("file-123", result.get(0).getFileStoreId());
        assertEquals("file-123", result.get(1).getFileStoreId());

        verify(causeListRepository, times(2)).getCauseListFileStore(any(CauseListSearchCriteria.class));
    }

    @Test
    void testGetRecentCauseList_withNoFileStores_shouldReturnNullFileStoreId() {
        // Given
        String courtId = "COURT999";
        RecentCauseListSearchRequest request = RecentCauseListSearchRequest.builder()
                .recentCauseListSearchCriteria(
                        RecentCauseListSearchCriteria.builder().courtId(courtId).build()
                ).build();
        when(config.getCutoffTime()).thenReturn("17:00");
        when(causeListRepository.getCauseListFileStore(any()))
                .thenReturn(Collections.emptyList());

        // When
        List<RecentCauseList> result = causeListService.getRecentCauseList(request);

        // Then
        assertEquals(2, result.size());
        assertNull(result.get(0).getFileStoreId());
        assertNull(result.get(1).getFileStoreId());
    }

    @Test
    void testGetFileStoreForCauseList_withFutureDate_shouldThrowException() {
        // Given
        LocalDate futureDate = LocalDate.now().plusDays(2);
        CauseListSearchCriteria criteria = CauseListSearchCriteria.builder()
                .searchDate(futureDate)
                .courtId("COURT001")
                .build();

        // When + Then
        CustomException ex = assertThrows(CustomException.class, () -> {
            causeListService.getFileStoreForCauseList(criteria);
        });

        assertEquals("DK_CL_APP_ERR", ex.getCode());
        assertEquals("CauseList Search date cannot be after than tomorrow", ex.getMessage());
    }

    @Test
    void testGetFileStoreForCauseList_withValidDate_shouldReturnFileStores() {
        // Given
        LocalDate today = LocalDate.now();
        CauseListSearchCriteria criteria = CauseListSearchCriteria.builder()
                .searchDate(today)
                .courtId("COURT002")
                .build();

        List<String> expected = Arrays.asList("fileA", "fileB");

        when(causeListRepository.getCauseListFileStore(criteria)).thenReturn(expected);

        // When
        List<String> result = causeListService.getFileStoreForCauseList(criteria);

        // Then
        assertEquals(expected, result);
    }


//    @Test
//    void testGenerateCauseListForJudge_withHearings() {
//        // Mocking
//        List<ScheduleHearing> hearings = new ArrayList<>();
//        hearings.add(ScheduleHearing.builder().judgeId("judge001").eventType(new EventType("event1")).build());
//        when(hearingRepository.getHearings(any(), any(), any())).thenReturn(hearings);
//        when(mdmsUtil.fetchMdmsData(any(), any(), any(), any())).thenReturn(getMockMdmsData());
//
//        // Test
//        List<CauseList> causeLists = new ArrayList<>();
//        causeListService.generateCauseListForJudge("judge001", causeLists);
//
//        // Verify
//        assertFalse(CollectionUtils.isEmpty(causeLists));
//    }

    private Map<String, Map<String, JSONArray>> getMockMdmsData() {
        Map<String, Map<String, JSONArray>> data = new HashMap<>();
        Map<String, JSONArray> innerMap = new HashMap<>();
        JSONArray jsonArray = new JSONArray();
        jsonArray.add(new HashMap<>());
        innerMap.put("hearings", jsonArray);
        data.put("court", innerMap);
        return data;
    }
}

