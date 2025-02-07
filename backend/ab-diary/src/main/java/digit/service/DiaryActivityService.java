package digit.service;

import digit.enrichment.DiaryActivityEnrichment;
import digit.repository.DiaryActivityRepository;
import digit.web.models.CaseDiaryActivityListItem;
import digit.web.models.CaseDiaryActivitySearchRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Service;

import java.util.List;

import static digit.config.ServiceConstants.DIARY_ACTIVITY_SEARCH_EXCEPTION;

@Service
@Slf4j
public class DiaryActivityService {

    private final DiaryActivityEnrichment diaryActivityEnrichment;

    private final DiaryActivityRepository diaryActivityRepository;

    public DiaryActivityService(DiaryActivityEnrichment diaryActivityEnrichment, DiaryActivityRepository diaryActivityRepository) {
        this.diaryActivityEnrichment = diaryActivityEnrichment;
        this.diaryActivityRepository = diaryActivityRepository;
    }

    public List<CaseDiaryActivityListItem> getDiaryActivities(CaseDiaryActivitySearchRequest searchRequest) {
        log.info("operation = getDiaryActivities ,  result = IN_PROGRESS , CaseDiaryActivitySearchRequest : {} ", searchRequest);

        try {

            diaryActivityEnrichment.enrichDiaryActivitySearchRequest(searchRequest);

            log.info("operation = getDiaryActivities ,  result = SUCCESS , CaseDiaryActivitySearchRequest : {} ", searchRequest);

            return diaryActivityRepository.getCaseDiaryActivities(searchRequest);

        } catch (
                CustomException e) {
            log.error("Custom exception while searching");
            throw e;
        } catch (Exception e) {
            throw new CustomException(DIARY_ACTIVITY_SEARCH_EXCEPTION, "Error while searching");
        }
    }

}
