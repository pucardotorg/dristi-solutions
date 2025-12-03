package digit.service;

import digit.enrichment.HearingsEnrichment;
import digit.util.HearingUtil;
import digit.util.SchedulerUtil;
import digit.web.models.*;
import digit.web.models.scheduler.JudgeCalenderSearchCriteria;
import digit.web.models.scheduler.JudgeCalenderSearchRequest;
import digit.web.models.scheduler.JudgeRuleResponse;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class HearingServiceTest {

    private HearingUtil hearingUtil;
    private HearingsEnrichment hearingsEnrichment;
    private SchedulerUtil schedulerUtil;

    private HearingService hearingService;

    @BeforeEach
    public void setup() {
        hearingUtil = mock(HearingUtil.class);
        hearingsEnrichment = mock(HearingsEnrichment.class);
        schedulerUtil = mock(SchedulerUtil.class);
        hearingService = new HearingService(hearingUtil, hearingsEnrichment, schedulerUtil);
    }

    @Test
    public void testSearchHearings_successWithData() {
        HearingSearchRequest request = HearingSearchRequest.builder()
                .criteria(HearingCriteria.builder()
                        .fromDate(17980808085l)
                        .toDate(1835707057070l)
                        .courtId("court1")
                        .tenantId("tenant1")
                        .build())
                .requestInfo(RequestInfo.builder().build())
                .build();

        // Create Hearing with presidedBy judgeID list
        Hearing hearing = Hearing.builder()
                .presidedBy(PresidedBy.builder()
                        .judgeID(List.of("judge1"))
                        .build())
                .build();

        HearingListResponse hearingListResponse = HearingListResponse.builder()
                .hearingList(List.of(hearing))
                .totalCount(1)
                .build();

        // Mock getHearings returns response with one hearing
        when(hearingUtil.getHearings(request)).thenReturn(hearingListResponse);

        // Mock hearingsEnrichment.enrichHearings to return enriched list
        List<HearingSearchResponse> enrichedList = new ArrayList<>();
        enrichedList.add(HearingSearchResponse.builder()
                .hearingDate("2025-01-01")
                .dayStatus("SomeStatus")
                .noOfHearing(1)
                .build());
        when(hearingsEnrichment.enrichHearings(anyList())).thenReturn(enrichedList);

        HearingSearchListResponse result = hearingService.searchHearings(request);

        assertEquals(1, result.getTotalCount());
        assertEquals(1, result.getHearingList().size());

    }

    @Test
    public void testSearchHearings_nullHearingList() {
        HearingSearchRequest request = HearingSearchRequest.builder().build();
        when(hearingUtil.getHearings(request)).thenReturn(null);

        HearingSearchListResponse result = hearingService.searchHearings(request);

        assertEquals(0, result.getTotalCount());
        assertTrue(result.getHearingList().isEmpty());
    }

    @Test
    public void testSearchHearings_emptyHearingList() {
        HearingSearchRequest request = HearingSearchRequest.builder()
                .criteria(HearingCriteria.builder().build())
                .requestInfo(RequestInfo.builder().build())
                .build();

        HearingListResponse responseWithEmptyList = HearingListResponse.builder()
                .hearingList(new ArrayList<>())
                .totalCount(0)
                .build();

        when(hearingUtil.getHearings(request)).thenReturn(responseWithEmptyList);

        HearingSearchListResponse result = hearingService.searchHearings(request);

        assertEquals(0, result.getTotalCount());
        assertTrue(result.getHearingList().isEmpty());
    }

    @Test
    public void testSearchHearings_exceptionHandling() {
        HearingSearchRequest request = HearingSearchRequest.builder().build();

        when(hearingUtil.getHearings(request)).thenThrow(new RuntimeException("Failed to fetch"));

        CustomException ex = assertThrows(CustomException.class, () -> hearingService.searchHearings(request));
        assertEquals("HEARING_SEARCH_EXCEPTION", ex.getCode());  // Assuming constant string
    }
}
