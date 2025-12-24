package digit.enrichment;

import digit.config.Configuration;
import digit.util.IdgenUtil;
import digit.web.models.DigitalizedDocument;
import digit.web.models.DigitalizedDocumentRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@Slf4j
public class DigitalizedDocumentEnrichment {

    private final Configuration configuration;

    private final IdgenUtil idgenUtil;

    public DigitalizedDocumentEnrichment(Configuration configuration, IdgenUtil idgenUtil) {
        this.configuration = configuration;
        this.idgenUtil = idgenUtil;
    }

    public void enrichDigitalizedDocument(DigitalizedDocumentRequest digitalizedDocumentRequest) {

        DigitalizedDocument digitalizedDocument = digitalizedDocumentRequest.getDigitalizedDocument();

        digitalizedDocument.setId(String.valueOf(UUID.randomUUID()));

        String idName = configuration.getDigitalizedDocumentIdGenConfig();
        String idFormat = configuration.getDigitalizedDocumentIdGenFormat();
        String tenantId = digitalizedDocumentRequest.getDigitalizedDocument().getCaseFilingNumber().replace("-","");

        List<String> idList = idgenUtil.getIdList(digitalizedDocumentRequest.getRequestInfo(), tenantId, idName, idFormat, 1, false);
        log.info("Digitalized Document ID List: {}", idList);

        String documentNumber = digitalizedDocument.getCaseFilingNumber() + "-" + idList.get(0);
        digitalizedDocument.setDocumentNumber(documentNumber);

    }

}
