package digit.validator;

import digit.web.models.JudgeCalendarRule;
import digit.web.models.SearchCriteria;
import org.apache.commons.lang3.ObjectUtils;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class JudgeCalendarValidator {


    public void validateUpdateJudgeCalendar(List<JudgeCalendarRule> judgeCalendarRule) {
    }

    public <T extends SearchCriteria> void validateSearchRequest(T criteria) {
        if (ObjectUtils.isEmpty(criteria.getTenantId()))
            throw new CustomException("DK_SH_SEARCH_ERR", "tenantId is mandatory for search");

        if (ObjectUtils.isEmpty(criteria.getJudgeId()))
            throw new CustomException("DK_SH_SEARCH_ERR", "judgeId is mandatory for search");

        if (ObjectUtils.isEmpty(criteria.getCourtId()))
            throw new CustomException("DK_SH_SEARCH_ERR", "courtId is mandatory for search");
    }
}
