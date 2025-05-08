package digit.service;

import digit.enrichment.HearingsEnrichment;
import digit.util.HearingUtil;
import digit.web.models.HearingListResponse;
import digit.web.models.HearingSearchRequest;
import digit.web.models.HearingSearchResponse;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

import static digit.config.ServiceConstants.HEARING_SEARCH_EXCEPTION;

@Service
@Slf4j
public class HearingService {

    private final HearingUtil hearingUtil;

    private final HearingsEnrichment hearingsEnrichment;

    @Autowired
    public HearingService(HearingUtil hearingUtil, HearingsEnrichment hearingsEnrichment) {
        this.hearingUtil = hearingUtil;
        this.hearingsEnrichment = hearingsEnrichment;
    }

    public List<HearingSearchResponse> searchHearings(HearingSearchRequest hearingSearchRequest) {

        log.info("search hearings, result= IN_PROGRESS,  request = {} ", hearingSearchRequest);

        try {

            HearingListResponse hearingListResponse = hearingUtil.getHearings(hearingSearchRequest);

            if (hearingListResponse != null && hearingListResponse.getHearingList() != null) {
                return hearingsEnrichment.enrichHearings(hearingListResponse.getHearingList());
            }

            log.info("search hearings, result= SUCCESS, response = {} ", hearingListResponse);

            return new ArrayList<>();

        } catch (Exception e) {
            log.error("Error occurred while searching hearings");
            throw new CustomException(HEARING_SEARCH_EXCEPTION, e.getMessage());
        }
    }

}
