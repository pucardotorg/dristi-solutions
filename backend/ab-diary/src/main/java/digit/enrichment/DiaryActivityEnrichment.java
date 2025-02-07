package digit.enrichment;

import digit.util.DateUtil;
import digit.web.models.CaseDiaryActivitySearchCriteria;
import digit.web.models.CaseDiaryActivitySearchRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class DiaryActivityEnrichment {

    private final DateUtil dateUtil;

    public DiaryActivityEnrichment(DateUtil dateUtil) {
        this.dateUtil = dateUtil;
    }

    public void enrichDiaryActivitySearchRequest(CaseDiaryActivitySearchRequest searchRequest) {

        CaseDiaryActivitySearchCriteria searchCriteria = searchRequest.getCriteria();

        if (searchCriteria.getToDate() == null) {
            searchCriteria.setToDate(dateUtil.getCurrentDateInEpoch());
        }
        if (searchCriteria.getFromDate() == null) {
            searchCriteria.setFromDate(dateUtil.getStartOfCurrentMonthInEpoch());
        }

        searchRequest.setCriteria(searchCriteria);

    }

}
