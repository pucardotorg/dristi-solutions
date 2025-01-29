package digit.enrichment;

import digit.util.ADiaryUtil;
import digit.web.models.CaseDiary;
import digit.web.models.CaseDiaryRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.springframework.stereotype.Component;

import static digit.config.ServiceConstants.ENRICHMENT_EXCEPTION;

@Component
@Slf4j
public class ADiaryEnrichment {

    private final ADiaryUtil aDiaryUtil;

    public ADiaryEnrichment(ADiaryUtil aDiaryUtil) {
        this.aDiaryUtil = aDiaryUtil;
    }

    public void enrichSaveCaseDiary(CaseDiaryRequest caseDiaryRequest) {
        log.info("operation = enrichSaveCaseDiary ,  result = IN_PROGRESS , CaseDiaryRequest : {} ", caseDiaryRequest);

        try {
            CaseDiary diary = caseDiaryRequest.getDiary();
            RequestInfo requestInfo = caseDiaryRequest.getRequestInfo();
            User user = requestInfo.getUserInfo();

            diary.setId(aDiaryUtil.generateUUID());

            AuditDetails auditDetails = AuditDetails.builder().createdBy(user.getUuid()).lastModifiedBy(user.getUuid())
                    .createdTime(aDiaryUtil.getCurrentTimeInMilliSec()).lastModifiedTime(aDiaryUtil.getCurrentTimeInMilliSec())
                    .build();

            diary.setAuditDetails(auditDetails);

        } catch (Exception e) {
            log.error("Error occurred during enriching diary");
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error during enriching diary");
        }

        log.info("operation = enrichSaveCaseDiary ,  result = SUCCESS , CaseDiaryRequest : {} ", caseDiaryRequest);

    }

    public void enrichUpdateCaseDiary(CaseDiaryRequest caseDiaryRequest) {
        log.info("operation = enrichUpdateCaseDiary ,  result = IN_PROGRESS , CaseDiaryRequest : {} ", caseDiaryRequest);

        try {
            CaseDiary diary = caseDiaryRequest.getDiary();
            RequestInfo requestInfo = caseDiaryRequest.getRequestInfo();
            User user = requestInfo.getUserInfo();

            AuditDetails auditDetails = AuditDetails.builder()
                    .lastModifiedBy(user.getUuid())
                    .lastModifiedTime(aDiaryUtil.getCurrentTimeInMilliSec())
                    .build();

            diary.setAuditDetails(auditDetails);

        } catch (Exception e) {
            log.error("Error occurred during enriching diary");
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error during enriching diary");
        }

        log.info("operation = enrichUpdateCaseDiary ,  result = SUCCESS , CaseDiaryRequest : {} ", caseDiaryRequest);

    }
}
