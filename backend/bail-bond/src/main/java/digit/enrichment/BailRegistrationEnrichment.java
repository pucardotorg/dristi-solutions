package digit.enrichment;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.tracer.model.CustomException;
import digit.config.Configuration;
import digit.util.IdgenUtil;
import digit.util.WorkflowUtil;
import digit.web.models.Bail;
import digit.web.models.BailRequest;
import digit.web.models.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.UUID;

import static digit.config.ServiceConstants.*;

@Component
@Slf4j
public class BailRegistrationEnrichment {

    private final IdgenUtil idgenUtil;
    private final Configuration configuration;
    private final WorkflowUtil workflowUtil;

    @Autowired
    public BailRegistrationEnrichment(IdgenUtil idgenUtil, Configuration configuration, WorkflowUtil workflowUtil) {
        this.idgenUtil = idgenUtil;
        this.configuration = configuration;
        this.workflowUtil = workflowUtil;
    }

    /**
     * Enrich the bail application by setting values in different fields
     *
     * @param bailRequest the bail registration request body
     */
    public void enrichBailRegistration(BailRequest bailRequest) {
        try {
            Bail bail = bailRequest.getBail();
            AuditDetails auditDetails = AuditDetails.builder()
                    .createdBy(bailRequest.getRequestInfo().getUserInfo().getUuid())
                    .createdTime(System.currentTimeMillis())
                    .lastModifiedBy(bailRequest.getRequestInfo().getUserInfo().getUuid())
                    .lastModifiedTime(System.currentTimeMillis())
                    .build();
            bail.setAuditDetails(auditDetails);
            bail.setId(UUID.randomUUID().toString());
            bail.setIsActive(true);

            if (bail.getDocuments() != null) {
                bail.getDocuments().forEach(document -> {
                    document.setId(String.valueOf(UUID.randomUUID()));
                    document.setDocumentUid(document.getId());
                });
            }

            if (bail.getDocuments() != null) {
                bail.getDocuments().stream()
                        .filter(document -> document.getId() == null)
                        .forEach(BailRegistrationEnrichment::enrichDocumentOnCreate);
            }

        } catch (CustomException e) {
            log.error("Custom Exception occurred while enriching bail");
            throw e;
        } catch (Exception e) {
            log.error("Error enriching bail application: {}", e.getMessage());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error in bail enrichment service: " + e.getMessage());
        }
    }

    /**
     * Enrich the bail application on update
     *
     * @param bailRequest the bail registration request body
     */
    public void enrichBailBondUponUpdate(BailRequest bailRequest) {
        try {
            Bail bail = bailRequest.getBail();
            bail.getAuditDetails().setLastModifiedTime(System.currentTimeMillis());
            bail.getAuditDetails().setLastModifiedBy(bailRequest.getRequestInfo().getUserInfo().getUuid());

            if (bail.getDocuments() != null) {
                bail.getDocuments().forEach(document -> {
                    if (document.getId() == null)
                        document.setId(String.valueOf(UUID.randomUUID()));
                });
            }

            if (bail.getDocuments() != null) {
                bail.getDocuments().stream()
                        .filter(document -> document.getId() == null)
                        .forEach(BailRegistrationEnrichment::enrichDocumentOnCreate);
            }

        } catch (Exception e) {
            log.error("Error enriching bail application upon update: {}", e.getMessage());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error in bail enrichment service during bail update process: " + e.getMessage());
        }
    }

    private static void enrichDocumentOnCreate(Document document) {
        if (document.getId() == null) {
            document.setId(UUID.randomUUID().toString());
            document.setDocumentUid(document.getId());
        }
    }


}
