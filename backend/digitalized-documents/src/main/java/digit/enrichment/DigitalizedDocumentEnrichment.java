package digit.enrichment;

import digit.config.Configuration;
import digit.util.IdgenUtil;
import digit.web.models.DigitalizedDocument;
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

    public void enrichDigitalizedDocument(DigitalizedDocument digitalizedDocument) {
        digitalizedDocument.setId(String.valueOf(UUID.randomUUID()));

        String idName = configuration.getDigitalizedDocumentIdGenConfig();
        String idFormat = configuration.getDigitalizedDocumentIdGenFormat();
        String tenantId = digitalizedDocument.getTenantId();

        List<String> idList = idgenUtil.getIdList(null, tenantId, idName, idFormat, 1);
        log.info("Digitalized Document ID List: {}", idList);

        String documentNumber = digitalizedDocument.getCaseFilingNumber() + "-" + idList.get(0);
        digitalizedDocument.setDocumentNumber(documentNumber);

    }

}
