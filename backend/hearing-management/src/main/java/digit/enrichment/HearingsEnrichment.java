package digit.enrichment;

import digit.web.models.Hearing;
import digit.web.models.HearingResponse;
import digit.web.models.HearingSearchResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static digit.config.ServiceConstants.ENRICHMENT_ERROR;

@Component
@Slf4j
public class HearingsEnrichment {

    public List<HearingSearchResponse> enrichHearings(List<Hearing> hearingList) {

        try {
            log.info("Enriching hearings, result= IN_PROGRESS, request = {}", hearingList);

            // Group hearings by date (yyyy-MM-dd)
            Map<String, List<HearingResponse>> groupedByDate = hearingList.stream()
                    .filter(hearing -> hearing.getStartTime() != null)
                    .collect(Collectors.groupingBy(
                            hearing -> Instant.ofEpochMilli(hearing.getStartTime())
                                    .atZone(ZoneId.of("Asia/Kolkata"))
                                    .toLocalDate()
                                    .toString(),
                            Collectors.mapping(hearing -> HearingResponse.builder()
                                    .hearingType(hearing.getHearingType())
                                    .hearingStartTime(hearing.getStartTime())
                                    .hearingEndTime(hearing.getEndTime())
                                    .build(), Collectors.toList())
                    ));

            // Map to HearingSearchResponse list
            List<HearingSearchResponse> responseList = groupedByDate.entrySet().stream()
                    .map(entry -> HearingSearchResponse.builder()
                            .hearingDate(entry.getKey())
                            .noOfHearing(entry.getValue().size())
                            .hearingList(entry.getValue())
                            .build())
                    .collect(Collectors.toList());

            log.info("Enriching hearings, result= SUCCESS, response = {}", responseList);
            return responseList;

        } catch (Exception e) {
            log.error("Error occurred while enriching hearings");
            throw new RuntimeException(ENRICHMENT_ERROR, e);
        }
    }


}
