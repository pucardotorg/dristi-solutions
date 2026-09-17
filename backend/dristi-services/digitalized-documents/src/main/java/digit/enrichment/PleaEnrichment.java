package digit.enrichment;

import digit.util.DigitalizedDocumentUtil;
import digit.web.models.AuditDetails;
import digit.web.models.DigitalizedDocument;
import digit.web.models.DigitalizedDocumentRequest;
import digit.web.models.Document;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Slf4j
public class PleaEnrichment {

    private final DigitalizedDocumentUtil digitalizedDocumentUtil;

    public PleaEnrichment(DigitalizedDocumentUtil digitalizedDocumentUtil) {
        this.digitalizedDocumentUtil = digitalizedDocumentUtil;
    }

    public void enrichDocumentOnCreation(DigitalizedDocumentRequest request){
        DigitalizedDocument digitalizedDocument = request.getDigitalizedDocument();
        digitalizedDocument.setAuditDetails(new AuditDetails());
        digitalizedDocument.getAuditDetails().setCreatedBy(request.getRequestInfo().getUserInfo().getUuid());
        digitalizedDocument.getAuditDetails().setCreatedTime(digitalizedDocumentUtil.getCurrentTimeInMilliSec());
        digitalizedDocument.getAuditDetails().setLastModifiedBy(request.getRequestInfo().getUserInfo().getUuid());
        digitalizedDocument.getAuditDetails().setLastModifiedTime(digitalizedDocumentUtil.getCurrentTimeInMilliSec());

        enrichDocuments(request);

    }

    public void enrichDocumentOnUpdate(DigitalizedDocumentRequest request){
        DigitalizedDocument digitalizedDocument = request.getDigitalizedDocument();
        digitalizedDocument.getAuditDetails().setLastModifiedBy(request.getRequestInfo().getUserInfo().getUuid());
        digitalizedDocument.getAuditDetails().setLastModifiedTime(digitalizedDocumentUtil.getCurrentTimeInMilliSec());

        enrichDocuments(request);

    }

    public void enrichDocuments(DigitalizedDocumentRequest request){
        DigitalizedDocument digitalizedDocument = request.getDigitalizedDocument();
        List<Document> documents = digitalizedDocument.getDocuments();
        if(documents != null){
            documents.stream()
                    .filter(document -> document.getId() == null)
                    .forEach(document -> {
                        document.setId(String.valueOf(digitalizedDocumentUtil.generateUUID()));
                        document.setDocumentUid(document.getId());
                    });
        }
    }
}