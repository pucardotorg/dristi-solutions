package digit.enrichment;

import digit.util.DigitalizedDocumentUtil;
import digit.web.models.AuditDetails;
import digit.web.models.DigitalizedDocument;
import digit.web.models.DigitalizedDocumentRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class MediationEnrichment {

    private final DigitalizedDocumentUtil digitalizedDocumentUtil;

    @Autowired
    public MediationEnrichment(DigitalizedDocumentUtil digitalizedDocumentUtil) {
        this.digitalizedDocumentUtil = digitalizedDocumentUtil;
    }

    public void enrichCreateMediationDocument(DigitalizedDocumentRequest documentRequest) {
        log.info("operation = enrich ,  result = IN_PROGRESS");

        DigitalizedDocument document = documentRequest.getDigitalizedDocument();

        RequestInfo requestInfo = documentRequest.getRequestInfo();

        Long currentTime = digitalizedDocumentUtil.getCurrentTimeInMilliSec();
        String userUuid = requestInfo.getUserInfo().getUuid();

        AuditDetails auditDetails = AuditDetails.builder()
                .createdBy(userUuid)
                .createdTime(currentTime)
                .lastModifiedBy(userUuid)
                .lastModifiedTime(currentTime)
                .build();

        document.setAuditDetails(auditDetails);

        log.info("operation = enrich ,  result = SUCCESS");
    }

}
