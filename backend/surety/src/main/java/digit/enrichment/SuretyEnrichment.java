package digit.enrichment;

import digit.web.models.Surety;
import digit.web.models.SuretyRequest;
import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.models.AuditDetails;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.UUID;

import static digit.config.ServiceConstants.ENRICHMENT_EXCEPTION;

@Component
@Slf4j
public class SuretyEnrichment {

    @Autowired
    public SuretyEnrichment() {
    }

    public void enrichSurety(SuretyRequest suretyRequest) {
        try {
            Surety surety = suretyRequest.getSurety();
            if (suretyRequest.getRequestInfo().getUserInfo() != null) {
                AuditDetails auditDetails = AuditDetails
                        .builder()
                        .createdBy(suretyRequest.getRequestInfo().getUserInfo().getUuid())
                        .createdTime(System.currentTimeMillis())
                        .lastModifiedBy(suretyRequest.getRequestInfo().getUserInfo().getUuid())
                        .lastModifiedTime(System.currentTimeMillis())
                        .build();
                surety.setAuditDetails(auditDetails);
                surety.setId(String.valueOf(UUID.randomUUID()));
                if (surety.getDocuments() != null) {
                    surety.getDocuments().forEach(document -> {
                        document.setId(String.valueOf(UUID.randomUUID()));
                    });
                }
            }
        } catch (CustomException e) {
            log.error("Exception occurred while enriching application");
            throw e;
        } catch (Exception e) {
            log.error("Error occurred while enriching application: {}", e.getMessage());
            throw new CustomException(ENRICHMENT_EXCEPTION, e.getMessage());
        }
    }

    public void enrichSuretyUponUpdate(SuretyRequest suretyRequest) {
        try {
            // Enrich lastModifiedTime and lastModifiedBy in case of update
            Surety surety = suretyRequest.getSurety();
            surety.getAuditDetails().setLastModifiedTime(System.currentTimeMillis());
            if(suretyRequest.getRequestInfo()!= null && suretyRequest.getRequestInfo().getUserInfo()!= null)
             surety.getAuditDetails().setLastModifiedBy(suretyRequest.getRequestInfo().getUserInfo().getUuid());

            if (surety.getDocuments() != null) {
                surety.getDocuments().forEach(document -> {
                    if (document.getId() == null)
                        document.setId(String.valueOf(UUID.randomUUID()));
                });
            }
        } catch (Exception e) {
            log.error("Error enriching application upon update: {}", e.getMessage());
            throw new CustomException(ENRICHMENT_EXCEPTION, "Error enriching application upon update: " + e.getMessage());
        }
    }

}
