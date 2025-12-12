package digit.enrichment;

import digit.util.DigitalizedDocumentUtil;
import digit.web.models.AuditDetails;
import digit.web.models.DigitalizedDocumentRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class MediationEnrichment {

    private final DigitalizedDocumentUtil digitalizedDocumentUtil;

    private final DigitalizedDocumentEnrichment digitalizedDocumentEnrichment;

    @Autowired
    public MediationEnrichment(DigitalizedDocumentUtil digitalizedDocumentUtil, DigitalizedDocumentEnrichment digitalizedDocumentEnrichment) {
        this.digitalizedDocumentUtil = digitalizedDocumentUtil;
        this.digitalizedDocumentEnrichment = digitalizedDocumentEnrichment;
    }

    public void enrichCreateMediationDocument(DigitalizedDocumentRequest documentRequest) {
        log.info("operation = enrichCreateMediationDocument ,  result = IN_PROGRESS");

        RequestInfo requestInfo = documentRequest.getRequestInfo();

        String id = digitalizedDocumentUtil.generateUUID().toString();

        Long currentTime = digitalizedDocumentUtil.getCurrentTimeInMilliSec();
        String userUuid = requestInfo.getUserInfo().getUuid();

        AuditDetails auditDetails = AuditDetails.builder()
                .createdBy(userUuid)
                .createdTime(currentTime)
                .lastModifiedBy(userUuid)
                .lastModifiedTime(currentTime)
                .build();

        documentRequest.getDigitalizedDocument().setAuditDetails(auditDetails);

        documentRequest.getDigitalizedDocument().setId(id);

        digitalizedDocumentEnrichment.enrichDigitalizedDocument(documentRequest);

        log.info("operation = enrichCreateMediationDocument ,  result = SUCCESS");
    }

    public void enrichUpdateMediationDocument(DigitalizedDocumentRequest documentRequest) {
        log.info("operation = enrichUpdateMediationDocument ,  result = IN_PROGRESS");

        Long currentTime = digitalizedDocumentUtil.getCurrentTimeInMilliSec();
        String userUuid = documentRequest.getRequestInfo().getUserInfo().getUuid();

        AuditDetails auditDetails = documentRequest.getDigitalizedDocument().getAuditDetails();
        auditDetails.setLastModifiedBy(userUuid);
        auditDetails.setLastModifiedTime(currentTime);

        documentRequest.getDigitalizedDocument().setAuditDetails(auditDetails);

        log.info("operation = enrichUpdateMediationDocument ,  result = SUCCESS");
    }

}
