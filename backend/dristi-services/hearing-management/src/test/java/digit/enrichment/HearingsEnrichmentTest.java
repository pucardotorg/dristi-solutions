package digit.enrichment;

import digit.config.HearingSlotStatus;
import digit.config.MdmsDataConfig;
import digit.web.models.Hearing;
import digit.web.models.HearingResponse;
import digit.web.models.HearingSearchResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

public class HearingsEnrichmentTest {

    private HearingsEnrichment hearingsEnrichment;
    private MdmsDataConfig mdmsDataConfig;

    @BeforeEach
    public void setup() {
        mdmsDataConfig = Mockito.mock(MdmsDataConfig.class);
        hearingsEnrichment = new HearingsEnrichment(mdmsDataConfig);
    }

    @Test
    public void testEnrichHearings_normalDate() {
        long startTime = LocalDate.now().atStartOfDay(ZoneId.of("Asia/Kolkata")).toInstant().toEpochMilli();

        Hearing hearing = Hearing.builder()
                .hearingType("TYPE1")
                .startTime(startTime)
                .endTime(startTime + 3600000)
                .build();

        when(mdmsDataConfig.getCourtHolidays()).thenReturn(List.of());

        List<HearingSearchResponse> result = hearingsEnrichment.enrichHearings(List.of(hearing));

        assertEquals(1, result.size());
        HearingSearchResponse response = result.get(0);
        assertEquals(1, response.getNoOfHearing());
        assertEquals(null, response.getDayStatus());
    }

    @Test
    public void testEnrichHearings_courtHoliday() {
        String today = LocalDate.now().toString();

        long startTime = LocalDate.now().atStartOfDay(ZoneId.of("Asia/Kolkata")).toInstant().toEpochMilli();

        Hearing hearing = Hearing.builder()
                .hearingType("TYPE1")
                .startTime(startTime)
                .endTime(startTime + 3600000)
                .build();

        when(mdmsDataConfig.getCourtHolidays()).thenReturn(List.of(today));

        List<HearingSearchResponse> result = hearingsEnrichment.enrichHearings(List.of(hearing));

        assertEquals(HearingSlotStatus.COURT_NON_WORKING.getValue(), result.get(0).getDayStatus());
    }

    @Test
    public void testEnrichHearings_errorScenario() {
        Hearing hearing = Hearing.builder()
                .hearingType("TYPE1")
                .startTime(null)
                .endTime(null)
                .build();

        when(mdmsDataConfig.getCourtHolidays()).thenReturn(List.of());

        List<HearingSearchResponse> result = hearingsEnrichment.enrichHearings(List.of(hearing));

        assertEquals(0, result.size()); // hearing is filtered out due to null startTime
    }
}
